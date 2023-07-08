const fauna = require('../../../integrations/services/fauna.js');
const q = fauna.q;

const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
import { fromUrl, uploadFromUrl } from '@uploadcare/upload-client'

import mongo from "../../../integrations/services/mongo"
import prisma from "../../../integrations/services/prisma"
import redis from "../../../integrations/services/redis"


function FaunaDatabaseInitiations() {
    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATION
    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Accounts', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Content', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Configuration', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))


    // CREATE INDEXES - find_(object)_by_id
    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_account_by_id', source: fauna.q.Collection('Accounts'), terms: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_id', source: fauna.q.Collection('Content'), terms: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_configuration_by_id', source: fauna.q.Collection('Configuration'), terms: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_type', source: fauna.q.Collection('Content'), terms: [{ field: ['data', 'type'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    // CREATE DEFAULTS
    fauna.client.query(
        q.Let({
            create_id: q.NewId(),
            create: q.Create(q.Ref(q.Collection('Configuration'), 1), { data: {} }),
        }, q.Var("create"))
    ).then((result) => { console.log(result.data) }).catch(error => { console.error(error) });

}
async function RedisDatabaseInitiations() {
    await redis.set('content', "[]");
    await redis.set("configuration", "{}");
}
async function MySQLDatabaseInitiations() {
    // Execute Prisma migrate
}
function MongoDatabaseInitiations() {
    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATION
    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Accounts', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Content', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Configuration', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    

    mongo.CreateCollection()

    // CREATE INDEXES - find_(object)_by_id
    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_account_by_id', source: fauna.q.Collection('Accounts'), terms: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_id', source: fauna.q.Collection('Content'), terms: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_configuration_by_id', source: fauna.q.Collection('Configuration'), terms: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_type', source: fauna.q.Collection('Content'), terms: [{ field: ['data', 'type'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    // CREATE DEFAULTS
    fauna.client.query(
        q.Let({
            create_id: q.NewId(),
            create: q.Create(q.Ref(q.Collection('Configuration'), 1), { data: {} }),
        }, q.Var("create"))
    ).then((result) => { console.log(result.data) }).catch(error => { console.error(error) });

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

                // Fauna
                if (process.env.FAUNA_DATABASE_SERVER_KEY) {
                    FaunaDatabaseInitiations();
                }

                // Redis
                if (process.env.REDIS_SERVICE_REST_URL) {
                    RedisDatabaseInitiations();
                }


                // MySQL
                if (process.env.REDIS_SERVICE_REST_URL) {
                    MySQLDatabaseInitiations();
                }


                res.status(200).json({ name: 'Initiations Complete' })
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
                    azure_storage: false,
                    uploadcare_storage: false,
                }

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