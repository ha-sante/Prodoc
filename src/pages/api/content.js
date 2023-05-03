const fauna = require('../../integrations/fauna.js');
let q = fauna.q;

export default function handler(req, res) {
    const method = req.method;
    const body = req.body;
    const params = req.query;

    switch (method) {
        case "POST":
            // Process a POST request
            fauna.client.query(
                q.Let({
                    create_id: q.NewId(),
                    create: q.Create(q.Ref(q.Collection('Content'), q.Var("create_id")), { data: q.Merge(body, { id: q.Var("create_id") }) }),
                }, q.Var("create"))
            ).then((result) => {
                res.status(200).json(result.data)
            }).catch(error => {
                res.status(404).send(error)
            });
            break;
        case "GET":
            // Process a GET request
            fauna.client.query(
                q.Map(
                    q.Paginate(q.Documents(q.Collection("Content")), { size: 100000 }),
                    q.Lambda("x", q.Get(q.Var("x")))
                )
            ).then(result => {
                let pages = result.data.map(page => page.data);
                res.status(200).send(pages);
            }).catch(error => {
                res.status(404).send(error)
            });
            break;
        case "PUT":
            // Process a PUT request
            fauna.client.query(
                q.Update(q.Ref(q.Collection('Content'), body.id), { data: { ...body } })
            ).then(result => {
                res.status(200).send(result.data);
            }).catch(error => {
                res.status(404).send(error)
            });
            break;

        case "DELETE":
            // Process a DELETE request
            fauna.client.query(
                q.Delete(q.Ref(q.Collection('Content'), params.id))
            ).then(result => {
                res.status(200).send(result.data);
            }).catch(error => {
                res.status(404).send(error)
            });
        case "PATCH":
            // Process a PATCH request
            // BULK UPLOADING OF CHAPTER & PAGES 
            // !FOR PROCESSING BULK API CONTENT ONLY
            fauna.client.query(
                q.Let(
                    {
                        // DELETE ALL API CONTENT STORED CURRENTLY
                        deleted: q.Map(
                            q.Paginate(
                                q.Match(q.Index("find_content_by_type"), "api")
                            ),
                            q.Lambda("ref", q.Delete(q.Var("ref")))
                        ),

                        // UPDATE CONFIGURATIONS WITH THE NEWLY RECIEVED DATA
                        configured: q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...body?.configuration } }),

                        // CREATE THE API PAGES ANEW
                        chapters: q.Map(body.chapters,
                            q.Lambda(
                                'page',
                                q.Let({
                                    chapter_id: q.NewId(),
                                    data: q.Create(
                                        q.Ref(q.Collection('Content'), q.Var('chapter_id')),
                                        { data: q.Merge(q.Var('page'), { id: q.Var("chapter_id") }) },
                                    )
                                }, q.Select(['data'], q.Var("data")))
                            )),
                        pages: q.Map(body.pages,
                            q.Lambda(
                                'page',
                                q.Let({
                                    page_id: q.NewId(),
                                    data: q.Create(
                                        q.Ref(q.Collection('Content'), q.Var('page_id')),
                                        { data: q.Merge(q.Var('page'), { id: q.Var("page_id") }) },
                                    )
                                }, q.Select(['data'], q.Var("data")))
                            )),

                        // - for each chapter
                        // - find every page that has the same child tag as it
                        // - add the page_id to the chapters children[]
                        update_chapters: q.Map(q.Var("chapters"),
                            q.Lambda(
                                'chapter',
                                q.Let({
                                    title: q.Select(["title"], q.Var("chapter")),
                                    chapter_id: q.Select(["id"], q.Var("chapter")),
                                    matches: q.Filter(q.Var("pages"),
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
                            )),
                    },
                    q.Var("update_chapters")
                )
            ).then(result => {
                res.status(200).send(result);
            }).catch(error => {
                res.status(404).send(error)
            });
    }
}