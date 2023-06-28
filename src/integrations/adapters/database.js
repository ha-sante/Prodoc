const fauna = require('../services/fauna.js');
const redis = require('../services/redis.js');

let q = fauna.q;
const _ = require('lodash');

// PAGES
class FaunaPagesDatabaseHandler {
    constructor(body, params) {
        this.body = body;
        this.params = params;
    }

    async create() {
        return new Promise(async (resolve, reject) => {

            // SEND REQUEST
            let request = q.Let({
                create_id: q.NewId(),
                create: q.Create(q.Ref(q.Collection('Content'), q.Var("create_id")), { data: q.Merge(this.body, { id: q.Var("create_id") }) }),
            }, q.Var("create"));

            fauna.client.query(request).then(async (result) => {
                // HANDLE CACHING
                await redis.client.set("content_cache_valid", false);

                // SEND REPLY
                resolve(result.data)
            }).catch(error => {
                console.log("api.content.create.error", error);
                reject(error)
            });

        });
    }

    async put() {
        return new Promise(async (resolve, reject) => {

            // console.log("exeuction.fauna")
            // ! FOR WHEN WE WANT EDITOR TO BE EMPTY - USING AN EMPTY OBJECT WONT GET ITS CONTENT DELETED (BY FAUNA DB)
            let ready = this.body;
            let editor_empty = _.isEmpty(ready?.content?.editor)
            console.log("is.editor.empty", editor_empty);
            let editor = editor_empty ? { time: null, blocks: null, version: null } : this.body.content.editor;
            console.log("here.editor", editor);
            ready.content.editor = editor;

            // Process a PUT request
            fauna.client.query(
                q.Update(q.Ref(q.Collection('Content'), this.body.id), { data: { ...ready } })
            ).then(async (result) => {
                // HANDLE CACHING
                await redis.client.set("content_cache_valid", false);
                console.log("api.content.update.result", result);

                // SEND REPLY
                resolve(result.data);
            }).catch(error => {
                console.log("api.content.update.error", error);
                reject(error)
            });

        });
    }

    async delete() {
        console.log("exeuction.fauna")
        return new Promise(async (resolve, reject) => {

            // Process a DELETE request
            fauna.client.query(
                q.Delete(q.Ref(q.Collection('Content'), this.params.id))
            ).then(async (result) => {
                // HANDLE CACHING
                await redis.client.set("content_cache_valid", false);

                // SEND REPLY
                resolve(result.data);
            }).catch(error => {
                console.log("content.delete.error", error);
                reject(error)
            });

        });
    }

    async get() {
        console.log("exeuction.fauna")
        return new Promise(async (resolve, reject) => {

            let cache_valid = await redis.client.get("content_cache_valid");
            console.log("get.content.cache_valid", cache_valid);

            if (cache_valid == false || cache_valid == null) {
                fauna.client.query(
                    q.Map(
                        q.Paginate(q.Documents(q.Collection("Content")), { size: 99999 }),
                        q.Lambda("x", q.Get(q.Var("x")))
                    )
                ).then(async (result) => {
                    // HANDLE CACHE
                    let pages = result.data.map(page => page.data);
                    await redis.client.set("content", pages);
                    await redis.client.set("content_cache_valid", true);

                    // SEND REPLY
                    resolve(pages);
                }).catch(error => {
                    console.log("get.content.error", error);
                    reject(error)
                });
            } else if (cache_valid == true) {
                let pages = await redis.client.get("content");
                resolve(pages);
            } else {
                resolve([]);
            }

        });
    }

    async patch() {
        console.log("exeuction.fauna")

        return new Promise(async (resolve, reject) => {

            // console.clear();
            let body_size = utils.roughSizeOfObject(this.body);
            let configuration_object = utils.roughSizeOfObject(this.body?.configuration);
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
                let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...this.body?.configuration } }));
                console.log("api.patch.configured", true);
                const end = performance.now();
                const executionTime = end - start;
                console.log("api.patch.error.call.end", `${end} ms`);
                console.log("api.patch.error.call.executionTime", msConversion(executionTime));


                // CREATE THE FOLDER/PARENT PAGES
                let chapters = await fauna.client.query(q.Map(this.body.chapters,
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
                this.body.pages.map((page) => {
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
                await redis.client.set("content_cache_valid", false);

                // SEND REPLY
                let data = [...updated_chapters, ...pages];
                resolve(data);
            } catch (error) {
                const end = performance.now();
                const executionTime = end - start;
                console.log("api.patch.error.call.end", `${end} ms`);
                console.log("api.patch.error.call.executionTime", msConversion(executionTime));

                console.log("api.content.patch.error", error);
                reject(error);
            }


        });

    }
}

class PagesDatabaseHandler {
    constructor(body, params) {
        this.database = "fauna"; // DECICDE PER ENVIRONMENTS VARIABLES AVAILABLE
        this.body = body;
        this.params = params;
    }

    async create() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaPagesDatabaseHandler(this.body, this.params);
                let result = await method.create();
                return result;
                break;
        }
    }
    async get() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaPagesDatabaseHandler(this.body, this.params);
                let result = await method.get();
                return result;
                break;
        }
    }

    async put() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaPagesDatabaseHandler(this.body, this.params);
                let result = await method.put();
                return result;
                break;
        }
    }

    async delete() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaPagesDatabaseHandler(this.body, this.params);
                let result = await method.delete();
                return result;
                break;
        }
    }


    async patch() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaPagesDatabaseHandler(this.body, this.params);
                let result = await method.patch();
                return result;
                break;
        }
    }
}

// CONFIG
class FaunaConfigDatabaseHandler {
    constructor(body, params) {
        this.body = body;
        this.params = params;
    }

    async get() {
        return new Promise(async (resolve, reject) => {
            fauna.client.query(q.Get(q.Ref(q.Collection('Configuration'), "1"))).then((result) => {
                resolve(result.data);
            }).catch(error => {
                console.log("get.content.error", error);
                reject(error)
            });
        });
    }

    async put() {
        return new Promise(async (resolve, reject) => {

            try {
                let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...this.body } }));
                resolve(configured.data);
            } catch (error) {
                console.log("api.config.put.error", error);
                reject(error);
            }

        });
    }
}

class ConfigDatabaseHandler {
    constructor(body, params) {
        this.database = "fauna"; // DECICDE PER ENVIRONMENTS VARIABLES AVAILABLE
        this.body = body;
        this.params = params;
    }

    async get() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaConfigDatabaseHandler(this.body, this.params);
                let result = await method.get();
                return result;
                break;
        }
    }

    async put() {
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                let method = new FaunaConfigDatabaseHandler(this.body, this.params);
                let result = await method.put();
                return result;
                break;
        }
    }

}

module.exports = { PagesDatabaseHandler, ConfigDatabaseHandler }