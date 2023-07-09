const fauna = require('../../../integrations/services/fauna.js');
const q = fauna.q;

const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
import { fromUrl, uploadFromUrl } from '@uploadcare/upload-client'

import mongo from "../../../integrations/services/mongo"
import prisma from "../../../integrations/services/prisma"
import { redis } from "../../../integrations/services/redis"
import { ObjectId } from "mongodb";

let config = {
    accounts: "Accounts",
    content: "Content",
    configuration: "Configuration"
}


async function FaunaDatabaseInitiations() {
    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATION
    await fauna.client.query(
        fauna.q.CreateCollection({ name: 'Accounts', history_days: 14, ttl_days: 14 })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    await fauna.client.query(
        fauna.q.CreateCollection({ name: 'Content', history_days: 14, ttl_days: 14 })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    await fauna.client.query(
        fauna.q.CreateCollection({ name: 'Configuration', history_days: 14, ttl_days: 14 })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))


    // CREATE INDEXES - find_(object)_by_id
    await fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_account_by_id', source: fauna.q.Collection('Accounts'), terms: [{ field: ['data', 'id'] }] })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    await fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_id', source: fauna.q.Collection('Content'), terms: [{ field: ['data', 'id'] }] })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    await fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_configuration_by_id', source: fauna.q.Collection('Configuration'), terms: [{ field: ['data', 'id'] }] })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    await fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_type', source: fauna.q.Collection('Content'), terms: [{ field: ['data', 'type'] }] })
    ).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    // CREATE DEFAULTS
    await fauna.client.query(
        q.Let({
            create_id: q.NewId(),
            create: q.Create(q.Ref(q.Collection('Configuration'), 1), { data: {} }),
        }, q.Var("create"))
    ).catch(error => { console.error(error) });

}
async function RedisDatabaseInitiations() {
    await redis.set('content', "[]");
    await redis.set("configuration", "{}");
}
async function MySQLDatabaseInitiations() {
    // Execute Prisma migrate
}
async function MongoDatabaseInitiations() {
    // CONNECT
    const client = (await mongo).db();

    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATION
    await client.createCollection(config.accounts).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });
    await client.createCollection(config.content).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });
    await client.createCollection(config.configuration).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });

    // CREATE INDEXES - find_(object)_by_id
    await client.createIndex(config.accounts, { "id": 1 }).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });
    await client.createIndex(config.content, { "id": 1 }).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });
    await client.createIndex(config.configuration, { "id": 1, "type": 1 }).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });

    // CREATE DEFAULTS
    await client.collection(config.configuration).insertOne({ _id: 1, id: 1, state: "Initiated" }).catch((error) => {
        // Handle the rejection
        console.log('The promise was rejected:', error);
        return undefined;
    });
}



export default async function handler(req, res) {
    const method = req.method;
    const body = req.body;
    const params = req.query;

    console.log("recieved.request", { method, params, body });

    switch (method) {
        case "POST":
            // Process a POST request
            if (params.password == process.env.EDITOR_PASSWORD) {

                console.log("Proceeding with initiations")

                try {
                    // Fauna
                    if (process.env?.FAUNA_DATABASE_SERVER_KEY) {
                        await FaunaDatabaseInitiations();
                    }

                    // Redis
                    if (process.env?.REDIS_SERVICE_REST_URL) {
                        await RedisDatabaseInitiations();
                    }

                    // MySQL
                    if (process.env?.PRISMA_SQL_DATABASE_SERVICE_CONNECTION_STRING) {
                        await MySQLDatabaseInitiations();
                    }

                    // Mongo
                    if (process.env?.MONGO_DATABASE_CONNECTION_STRING) {
                        await MongoDatabaseInitiations();
                    }

                    res.status(200).json({ name: 'Initiations Complete' })
                } catch (error) {
                    console.log("error", error)
                    res.status(404).send({ message: "Error initializing", error })
                };

            } else {
                res.status(404).send({ message: "UnAuthorized" })
            }

            break;
        case "GET":
            // Process a GET request
            if (params.password == process.env.EDITOR_PASSWORD) {
                // GET THE STATUS OF EVERY SERVICE TO CECK IF THEY INIT
                let status = {
                    fauna: false,
                    redis: false,
                    mysql: false,
                    mongo: false,
                    azure_storage: false,
                    uploadcare_storage: false,
                }
                const client = (await mongo).db();


                // Fauna
                try {
                    let result = await fauna.client.query(q.ToDate('2018-06-06'))
                    status.fauna = true;
                } catch (error) {
                    status.fauna = error;
                }

                // Redis
                let result = await redis.ping()
                if (result) {
                    status.redis = true;
                }

                // MySQL
                try {
                    let result = await prisma.$queryRaw`SELECT 1`
                    status.mysql = true;
                } catch (error) {
                    status.mysql = error;
                }


                // AZURE STORAGE
                try {
                    const connectionString = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING
                    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
                    await blobServiceClient.setProperties({ defaultServiceVersion: "2020-02-10" }); // TO ENABLE CONTENT DISPOSITION FEATURES

                    let info = await blobServiceClient.getProperties()
                    status.azure_storage = true;
                } catch (error) {
                    status.azure_storage = { code: error.code };
                }


                // UPLOADCARE
                try {
                    let test_url = "https://ui-avatars.com/api/?name=Prodoc";
                    const result = await fromUrl(test_url, {
                        publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_SERVICE_PUBLIC_KEY,
                        store: "auto",
                    })
                    status.uploadcare_storage = true;
                } catch (error) {
                    console.log("error", error);
                    status.uploadcare_storage = `${error}`;
                }


                // Mongo
                try {
                    await client.listCollections();
                    status.mongo = true;
                } catch (error) {
                    console.log("error", error);
                    status.mongo = `${error}`;
                }

                res.status(200).json({ ...status })
            } else {
                res.status(404).send({ message: "UnAuthorized" })
            }

            break;
        case "PATCH":
            // Process a POST request
            res.status(200).json({ message: 'I am responding' })

            break;
    }
}