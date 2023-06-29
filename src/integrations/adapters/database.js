const fauna = require('../services/fauna.js');
const redis = require('../services/redis.js');
const utils = require('../services/utils.js');

import prisma from "../services/prisma"


let q = fauna.q;
const _ = require('lodash');


// Database - In use
const Databased = () => {
    if (process.env.FAUNA_DATABASE_SERVER_KEY) {
        return "fauna"
    }

    if (process.env.PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING) {
        return "prisma"
    }

    if (process.env.POCKETBASE_DATABASE_CONNECTION_STRING) {
        return "pocketbase"
    }
}

// EXECUTIONERS
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


                // STORE THE OPEN API SPEC
                let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...this.body?.configuration } }));


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
                console.log("api.content.patch.error", error);
                reject(error);
            }

        });

    }
}
class PrismaPagesDatabaseHandler {
    constructor(body, params) {
        this.body = body;
        this.params = params;
    }

    async create() {
        return new Promise(async (resolve, reject) => {

            try {
                let page = await prisma.page.create({ data: { ...this.body } })
                let result = { ...page, id: String(page.id) };
                await redis.client.set("content_cache_valid", false);
                resolve(result);
            } catch (error) {
                console.log("sql.pages.create.error", error);
                reject(error);
            }

        });
    }

    async put() {
        return new Promise(async (resolve, reject) => {
            // ! FOR WHEN WE WANT EDITOR TO BE EMPTY - USING AN EMPTY OBJECT WONT GET ITS CONTENT DELETED (BY FAUNA DB)
            let ready = this.body;
            let editor_empty = _.isEmpty(ready?.content?.editor)
            console.log("is.editor.empty", editor_empty);
            let editor = editor_empty ? { time: null, blocks: null, version: null } : this.body.content.editor;
            console.log("here.editor", editor);
            ready.content.editor = editor;
            ready.id = Number(ready.id);

            try {
                let page = await prisma.page.update({ where: { id: Number(ready.id) }, data: { ...ready } })
                let result = { ...page, id: String(page.id) };

                await redis.client.set("content_cache_valid", false);
                console.log("sql.pages.create", result);
                resolve(result);
            } catch (error) {
                console.log("sql.pages.create.error", error);
                reject(error);
            }

        });
    }

    async delete() {
        return new Promise(async (resolve, reject) => {

            try {
                let page = await prisma.page.delete({ where: { id: Number(this.params.id) } })
                let result = { ...page, id: String(page.id) };

                await redis.client.set("content_cache_valid", false);
                console.log("sql.pages.create", result);
                resolve(result);
            } catch (error) {
                console.log("sql.pages.create.error", error);
                reject(error);
            }

        });
    }

    async get() {
        return new Promise(async (resolve, reject) => {

            let cache_valid = await redis.client.get("content_cache_valid");
            console.log("get.content.cache_valid", cache_valid);

            if (cache_valid == false || cache_valid == null) {
                try {
                    let raw = await prisma.page.findMany()
                    let pages = raw.map(page => {
                        return ({ ...page, id: String(page.id) })
                    })
                    await redis.client.set("content", pages);
                    await redis.client.set("content_cache_valid", true);

                    resolve(pages);
                } catch (error) {
                    console.log("sql.pages.create.error", error);
                    reject(error);
                }
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

            // Process a PATCH request
            // BULK UPLOADING OF CHAPTER & PAGES 
            // !FOR PROCESSING BULK API CONTENT ONLY
            try {

                // BULK DELETE ALL API PAGES
                let deleted = await prisma.page.deleteMany({ where: { type: "api" } })
                console.log("api.patch.deleted", true)


                // STORE THE OPEN API SPEC
                // let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...this.body?.configuration } }));
                await prisma.configuration.update({ where: { id: 1 }, data: { ...this.body?.configuration } })
                console.log("api.patch.configured", true);

                // CREATE THE FOLDER/PARENT PAGES

                await prisma.page.createMany({ data: this.body.chapters })
                let chapters = await prisma.page.findMany({ where: { position: "chapter", type: "api" } });
                console.log("api.patch.chapters", true);


                let parented_pages = [];
                // MAP CHAPTERS TO THEIR PAGES
                this.body.pages.map((page) => {
                    let tags = [...page.content.api.tags];
                    // CHECK IF THE PAGE TAGS
                    let parents = chapters.filter((chapter) => tags.includes(chapter.title))
                    let parent_id = parents[0]?.id;
                    let parent = parent_id != undefined ? `${parent_id}` : "chapter"; // TAG THE PAGES PARENT
                    parented_pages.push({ ...page, parent });
                })

                // CREATE THE CHILD PAGES
                await prisma.page.createMany({ data: parented_pages })
                let pages = await prisma.page.findMany({ where: { position: "child", type: "api" } });
                console.log("api.patch.pages", true);

                // UPDATE THE PARENT PAGES WITH IDS OF THEIR CHILDREN
                let updated_chapters = chapters.map(async (page) => {
                    let matches = pages.filter((item) => {
                        return item?.content?.api?.tags.includes(page.title);
                    });

                    let children = matches.map(child => `${child.id}`);

                    // UPDATE THE CHAPTER WITH THE NEW CHILDREN DATA
                    let raw = await prisma.page.update({ where: { id: page.id }, data: { children } })
                    let result = { ...raw, id: String(raw.id) }
                    console.log("result", true);

                    return result;
                });
                console.log("api.patch.updated_chapters", true);


                // HANDLE CACHING
                await redis.client.set("content_cache_valid", false);

                // SEND REPLY
                let data = [...updated_chapters, ...pages];
                resolve(data);
            } catch (error) {
                console.log("api.content.patch.error", error);
                reject(error);
            }

        });

    }
}
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
class PrismaConfigDatabaseHandler {
    constructor(body, params) {
        this.body = body;
        this.params = params;
    }

    async get() {
        return new Promise(async (resolve, reject) => {

            try {
                let result = await prisma.configuration.findUnique({ where: { id: 1 } });
                resolve(result);
            } catch (error) {
                console.log("sql.pages.create.error", error);
                reject(error);
            }

        });
    }

    async put() {
        return new Promise(async (resolve, reject) => {

            try {
                let result = await prisma.configuration.update({ where: { id: 1 }, data: { ...this.body } });
                resolve(result);
            } catch (error) {
                console.log("api.config.put.error", error);
                reject(error);
            }

        });
    }
}


// HANDLERS
class PagesDatabaseHandler {
    constructor(body, params) {
        this.database = Databased();
        this.body = body;
        this.params = params;


        console.log("Database adapter is connected to ", this.database);
    }

    async create() {
        let method = null;
        let result = null;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaPagesDatabaseHandler(this.body, this.params);
                result = await method.create();
                return result;
                break;
            case "prisma":
                // USE FAUNA METHOD
                method = new PrismaPagesDatabaseHandler(this.body, this.params);
                result = await method.create();
                return result;
                break;
        }
    }

    async put() {
        let method = null;
        let result = null;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaPagesDatabaseHandler(this.body, this.params);
                result = await method.put();
                return result;
                break;
            case "prisma":
                // USE FAUNA METHOD
                method = new PrismaPagesDatabaseHandler(this.body, this.params);
                result = await method.put();
                return result;
                break;
        }
    }

    async get() {
        let method, result;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaPagesDatabaseHandler(this.body, this.params);
                result = await method.get();
                return result;
                break;
            case "prisma":
                // USE FAUNA METHOD
                method = new PrismaPagesDatabaseHandler(this.body, this.params);
                result = await method.get();
                return result;
                break;
        }
    }


    async delete() {
        let method = null;
        let result = null;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaPagesDatabaseHandler(this.body, this.params);
                result = await method.delete();
                return result;
                break;
            case "prisma":
                // USE FAUNA METHOD
                method = new PrismaPagesDatabaseHandler(this.body, this.params);
                result = await method.delete();
                return result;
                break;
        }
    }


    async patch() {
        let method = null;
        let result = null;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaPagesDatabaseHandler(this.body, this.params);
                result = await method.patch();
                return result;
                break;
            case "prisma":
                // USE FAUNA METHOD
                method = new PrismaPagesDatabaseHandler(this.body, this.params);
                result = await method.patch();
                return result;
                break;
        }
    }
}

class ConfigDatabaseHandler {
    constructor(body, params) {
        this.database = Databased();
        this.body = body;
        this.params = params;

        console.log("Database adapter is connected to ", this.database);
    }

    async get() {
        let method = null;
        let result = null;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaConfigDatabaseHandler(this.body, this.params);
                result = await method.get();
                return result;
                break;
            case "prisma":
                // USE PRISMA METHOD
                method = new PrismaConfigDatabaseHandler(this.body, this.params);
                result = await method.get();
                return result;
                break;
        }
    }

    async put() {
        let method = null;
        let result = null;
        switch (this.database) {
            case "fauna":
                // USE FAUNA METHOD
                method = new FaunaConfigDatabaseHandler(this.body, this.params);
                result = await method.put();
                return result;
                break;
            case "prisma":
                // USE PRISMA METHOD
                method = new PrismaConfigDatabaseHandler(this.body, this.params);
                result = await method.put();
                return result;
                break;
        }
    }

}

module.exports = { PagesDatabaseHandler, ConfigDatabaseHandler }