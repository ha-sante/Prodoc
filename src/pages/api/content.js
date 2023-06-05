const fauna = require('../../integrations/fauna.js');
let q = fauna.q;
import { kv } from "@vercel/kv"; // CACHING LAYER

export default async function handler(req, res) {
    const method = req.method;
    const body = req.body;
    const params = req.query;

    console.log("recieved.request", { method, params });

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
            // Process a PUT request
            return fauna.client.query(
                q.Update(q.Ref(q.Collection('Content'), body.id), { data: { ...body } })
            ).then(async (result) => {
                // HANDLE CACHING
                await kv.set("content_cache_valid", false);

                // SEND REPLY
                res.status(200).send(result.data);
            }).catch(error => {
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

            // Process a PATCH request
            // BULK UPLOADING OF CHAPTER & PAGES 
            // !FOR PROCESSING BULK API CONTENT ONLY

            // BULK DELETE ALL API PAGES
            let deleted = await fauna.client.query(q.Map(
                q.Paginate(
                    q.Match(q.Index("find_content_by_type"), "api"),
                    { size: 99999 }
                ),
                q.Lambda("ref", q.Delete(q.Var("ref")))
            ));
            console.log("api.patch.deleted", true);

            let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...body?.configuration } }));
            console.log("api.patch.configured", true);

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


            let pages = await fauna.client.query(q.Map(body.pages,
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


            // RECREATE ALL CHAPTER AND CHILDREN PAGES
            // return fauna.client.query(
            //     q.Let(
            //         {

            //             // UPDATE CONFIGURATIONS WITH THE NEWLY RECIEVED DATA
            //             // configured: q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...body?.configuration } }),

            //             // CREATE THE API PAGES ANEW
            //             // chapters: q.Map(body.chapters,
            //             //     q.Lambda(
            //             //         'page',
            //             //         q.Let({
            //             //             chapter_id: q.NewId(),
            //             //             data: q.Create(
            //             //                 q.Ref(q.Collection('Content'), q.Var('chapter_id')),
            //             //                 { data: q.Merge(q.Var('page'), { id: q.Var("chapter_id") }) },
            //             //             )
            //             //         }, q.Select(['data'], q.Var("data")))
            //             //     )),
            //             // pages: q.Map(body.pages,
            //             //     q.Lambda(
            //             //         'page',
            //             //         q.Let({
            //             //             page_id: q.NewId(),
            //             //             data: q.Create(
            //             //                 q.Ref(q.Collection('Content'), q.Var('page_id')),
            //             //                 { data: q.Merge(q.Var('page'), { id: q.Var("page_id") }) },
            //             //             )
            //             //         }, q.Select(['data'], q.Var("data")))
            //             //     )),
            //             // - for each chapter
            //             // - find every page that has the same child tag as it
            //             // - add the page_id to the chapters children[]
            //             // update_chapters: q.Map(q.Var("chapters"),
            //             //     q.Lambda(
            //             //         'chapter',
            //             //         q.Let({
            //             //             title: q.Select(["title"], q.Var("chapter")),
            //             //             chapter_id: q.Select(["id"], q.Var("chapter")),
            //             //             matches: q.Filter(q.Var("pages"),
            //             //                 q.Lambda(
            //             //                     'page',
            //             //                     q.Let({
            //             //                         // CHECK IF CHAPTER IS FOUND IN PAGE'S TAGS
            //             //                         // IF TRUE, PAGE IS A CHILD OF CHAPTER
            //             //                         tags: q.Select(["content", "api", "tags"], q.Var("page")),
            //             //                         page_id: q.Select(["id"], q.Var("page")),
            //             //                         valid: q.ContainsValue(q.Var("title"), q.Var("tags")),
            //             //                     }, q.Var("valid"))
            //             //                 )),
            //             //             children: q.Map(q.Var("matches"), q.Lambda(
            //             //                 'child',
            //             //                 q.Select(["id"], q.Var("child"))
            //             //             )),
            //             //             updated: q.Merge(q.Var("chapter"), { children: q.Var("children") }),
            //             //             update: q.Update(q.Ref(q.Collection('Content'), q.Var("chapter_id")), { data: q.Var("updated") }),
            //             //         }, q.Select(["data"], q.Var("update")))
            //             //     )),
            //         },
            //         { chapters: q.Var("update_chapters"), pages: q.Var("pages") }
            //     )
            // ).then(async (result) => {
            //     // HANDLE CACHING
            //     await kv.set("content_cache_valid", false);

            //     // SEND REPLY
            //     let data = [...result.chapters, ...result.pages];
            //     res.status(200).send(data);
            // }).catch(error => {
            //     console.log("request.error", error);
            //     res.status(404).send(error)
            // });


            break;
        default:
            console.log("request.method.not.supported", method);
            res.status(404).send({ message: "Request method not supported" });
    }

}
export const config = {
    api: {
        responseLimit: '20mb',
        bodyParser: {
            sizeLimit: '20mb',
        },
    },
};