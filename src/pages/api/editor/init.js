const fauna = require('../../../integrations/services/fauna.js');
const redis = require('../../../integrations/services/redis.js');

const q = fauna.q;

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

async function VercelKVDatabaseInitiations() {
    await redis.client.set('content', "[]");
    await redis.client.set("configuration", "{}");
}

export default async function handler(req, res) {
    const method = req.method;
    const body = req.body;

    switch (method) {
        case "POST":
            // Process a POST request
            FaunaDatabaseInitiations();
            VercelKVDatabaseInitiations();
            res.status(200).json({ name: 'Initiations Complete' })
            break;
        case "GET":
            // Process a GET request
            break;
    }
}