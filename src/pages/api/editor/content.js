const fauna = require('../../integrations/services/fauna.js');
let q = fauna.q;
import { kv } from "@vercel/kv"; // CACHING LAYER
const _ = require('lodash');


export const config = {
    api: {
        responseLimit: '50mb',
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
};

function msConversion(millis) {
    const d = new Date(Date.UTC(0, 0, 0, 0, 0, 0, millis)),
        // Pull out parts of interest
        parts = [
            d.getUTCHours(),
            d.getUTCMinutes(),
            d.getUTCSeconds()
        ];

    // Zero-pad
    let output = "";

    if (parts[0]) {
        output += parts[0] + " hours ";
    }


    if (parts[1]) {
        output += parts[1] + " minutes ";
    }

    if (parts[2]) {
        output += parts[2] + " seconds ";
    }

    return output
}

const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

function niceBytes(x) {

    let l = 0, n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

export function roughSizeOfObject(object) {
    const objectList = [];
    const stack = [object];
    const bytes = [0];
    while (stack.length) {
        const value = stack.pop();
        if (value == null) bytes[0] += 4;
        else if (typeof value === 'boolean') bytes[0] += 4;
        else if (typeof value === 'string') bytes[0] += value.length * 2;
        else if (typeof value === 'number') bytes[0] += 8;
        else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
            objectList.push(value);
            if (typeof value.byteLength === 'number') bytes[0] += value.byteLength;
            else if (value[Symbol.iterator]) {
                // eslint-disable-next-line no-restricted-syntax
                for (const v of value) stack.push(v);
            } else {
                Object.keys(value).forEach(k => {
                    bytes[0] += k.length * 2; stack.push(value[k]);
                });
            }
        }
    }
    return niceBytes(bytes[0]);
}


export function SluggifyPageTitle(title, content) {
    let slugged = slugify(title);
    let copies = content.filter(page => page.slug == slugged);
    if(copies.length > 0){
      slugged += copies.length+1;
    }
  
    return slugged;
  }
  

export default async function handler(req, res) {
    const method = req.method;
    const body = req.body;
    const params = req.query;

    console.log("recieved.request", { method, params, body });

    // CACHING CONTENT
    // - Empty array with objects
    // - POST adds ontop of
    // - GET reads and sends it to requester
    // - DELETE reads, delete that object and resets the data
    // - PATCH replaces the whole key with the newly generated content

    // DATA STRUCTURE OF CHOICE - LISTS

    switch (method) {
        case "POST":
            // Process a POST request
            try {
                // SEND REQUEST
                let request = q.Let({
                    create_id: q.NewId(),
                    create: q.Create(q.Ref(q.Collection('Content'), q.Var("create_id")), { data: q.Merge(body, { id: q.Var("create_id") }) }),
                }, q.Var("create"));
                let result = await fauna.client.query(request);

                // HANDLE CACHING
                await kv.set("content_cache_valid", false);

                // SEND REPLY
                res.status(200).json(result.data)
            } catch (error) {
                console.log("content.post.error", error)
                res.status(404).send(error)
            }
            break;
        case "GET":
            // Process a GET request
            let cache_valid = await kv.get("content_cache_valid");
            console.log("get.content.cache_valid", cache_valid);

            if (cache_valid == false || cache_valid == null) {
                return fauna.client.query(
                    q.Map(
                        q.Paginate(q.Documents(q.Collection("Content")), { size: 99999 }),
                        q.Lambda("x", q.Get(q.Var("x")))
                    )
                ).then(async (result) => {
                    // HANDLE CACHE
                    let pages = result.data.map(page => page.data);
                    await kv.set("content", pages);
                    await kv.set("content_cache_valid", true);

                    // SEND REPLY
                    res.status(200).send(pages);
                }).catch(error => {
                    console.log("get.content.error", error);
                    res.status(404).send(error)
                });
            } else if (cache_valid == true) {
                let pages = await kv.get("content");
                res.status(200).send(pages);
            } else {
                res.status(200).send([]);
            }

            break;
        case "PUT":

            // ! FOR WHEN WE WANT EDITOR TO BE EMPTY - USING AN EMPTY OBJECT WONT GET ITS CONTENT DELETED (BY FAUNA DB)
            let ready = body;
            let editor_empty = _.isEmpty(ready?.content?.editor)

            console.log("is.editor.empty", editor_empty);

            let editor = editor_empty ? { time: null, blocks: null, version: null } : body.content.editor;

            console.log("here.editor", editor);

            ready.content.editor = editor;

            // Process a PUT request
            return fauna.client.query(
                q.Update(q.Ref(q.Collection('Content'), body.id), { data: { ...ready } })
            ).then(async (result) => {
                // HANDLE CACHING
                await kv.set("content_cache_valid", false);

                console.log("api.content.update.result", result);


                // SEND REPLY
                res.status(200).send(result.data);
            }).catch(error => {
                console.log("api.content.update.error", error);
                res.status(404).send(error)
            });
            break;
        case "DELETE":
            // Process a DELETE request
            return fauna.client.query(
                q.Delete(q.Ref(q.Collection('Content'), params.id))
            ).then(async (result) => {
                // HANDLE CACHING
                await kv.set("content_cache_valid", false);

                // SEND REPLY
                res.status(200).send(result.data);
            }).catch(error => {
                console.log("content.delete.error", error);
                res.status(404).send(error)
            });
            break;
        case "PATCH":
            // console.clear();
            let body_size = roughSizeOfObject(body);
            let configuration_object = roughSizeOfObject(body?.configuration);
            console.log("api.content.patch.called.diagnostics.body_size", body_size);
            console.log("api.content.patch.called.diagnostics.configuration_object", configuration_object);

            // Process a PATCH request
            // BULK UPLOADING OF CHAPTER & PAGES 
            // !FOR PROCESSING BULK API CONTENT ONLY
            let start = performance.now();
            try {

                // BULK DELETE ALL API PAGES
                let deleted = await fauna.client.query(q.Map(
                    q.Paginate(
                        q.Match(q.Index("find_content_by_type"), "api"),
                        { size: 99999 }
                    ),
                    q.Lambda("ref", q.Delete(q.Var("ref")))
                ));
                console.log("api.patch.deleted", true);

                start = performance.now();
                console.log("api.patch.configured.call.start", `${start} ms`);

                // STORE THE OPEN API SPEC
                let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...body?.configuration } }));
                console.log("api.patch.configured", true);
                const end = performance.now();
                const executionTime = end - start;
                console.log("api.patch.error.call.end", `${end} ms`);
                console.log("api.patch.error.call.executionTime", msConversion(executionTime));


                // CREATE THE FOLDER/PARENT PAGES
                let chapters = await fauna.client.query(q.Map(body.chapters,
                    q.Lambda(
                        'page',
                        q.Let({
                            chapter_id: q.NewId(),
                            data: q.Create(
                                q.Ref(q.Collection('Content'), q.Var('chapter_id')),
                                { data: q.Merge(q.Var('page'), { id: q.Var("chapter_id") }) },
                            )
                        }, q.Select(['data'], q.Var("data")))
                    )));
                console.log("api.patch.chapters", true);



                let parented_pages = [];
                // MAP CHAPTERS TO THEIR PAGES
                body.pages.map((page) => {
                    let tags = [...page.content.api.tags];
                    // CHECK IF THE PAGE TAGS
                    let parents = chapters.filter((chapter) => tags.includes(chapter.title))
                    let parent_id = parents[0]?.id;
                    let parent = parent_id != undefined ? parent_id : "chapter"; // TAG THE PAGES PARENT
                    parented_pages.push({ ...page, parent });
                })

                // CREATE THE CHILD PAGES
                let pages = await fauna.client.query(q.Map(parented_pages,
                    q.Lambda(
                        'page',
                        q.Let({
                            page_id: q.NewId(),
                            data: q.Create(
                                q.Ref(q.Collection('Content'), q.Var('page_id')),
                                { data: q.Merge(q.Var('page'), { id: q.Var("page_id") }) },
                            )
                        }, q.Select(['data'], q.Var("data")))
                    )));
                console.log("api.patch.pages", true);

                // UPDATE THE PARENT PAGES WITH IDS OF THEIR CHILDREN
                let updated_chapters = await fauna.client.query(q.Map(chapters,
                    q.Lambda(
                        'chapter',
                        q.Let({
                            title: q.Select(["title"], q.Var("chapter")),
                            chapter_id: q.Select(["id"], q.Var("chapter")),
                            matches: q.Filter(pages,
                                q.Lambda(
                                    'page',
                                    q.Let({
                                        // CHECK IF CHAPTER IS FOUND IN PAGE'S TAGS
                                        // IF TRUE, PAGE IS A CHILD OF CHAPTER
                                        tags: q.Select(["content", "api", "tags"], q.Var("page")),
                                        page_id: q.Select(["id"], q.Var("page")),
                                        valid: q.ContainsValue(q.Var("title"), q.Var("tags")),
                                    }, q.Var("valid"))
                                )),
                            children: q.Map(q.Var("matches"), q.Lambda(
                                'child',
                                q.Select(["id"], q.Var("child"))
                            )),
                            updated: q.Merge(q.Var("chapter"), { children: q.Var("children") }),
                            update: q.Update(q.Ref(q.Collection('Content'), q.Var("chapter_id")), { data: q.Var("updated") }),
                        }, q.Select(["data"], q.Var("update")))
                    )));
                console.log("api.patch.updated_chapters", true);


                // HANDLE CACHING
                await kv.set("content_cache_valid", false);

                // SEND REPLY
                let data = [...updated_chapters, ...pages];
                res.status(200).send(data);

            } catch (error) {
                const end = performance.now();
                const executionTime = end - start;
                console.log("api.patch.error.call.end", `${end} ms`);
                console.log("api.patch.error.call.executionTime", msConversion(executionTime));


                console.log("api.content.patch.error", error);
                res.status(404).send(error);
            }

            break;
        default:
            console.log("request.method.not.supported", method);
            res.status(404).send({ message: "Request method not supported" });
    }

}
