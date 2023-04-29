const fauna = require('../../integrations/fauna.js');

function FaunaDatabaseInitiations() {
    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATIONS
    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Accounts', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Content', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Configurations', history_days: 14, ttl_days: 14 })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))


    // CREATE INDEXES - find_(object)_by_id
    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_account_by_id', source: fauna.q.Collection('Accounts'), values: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_content_by_id', source: fauna.q.Collection('Content'), values: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))

    fauna.client.query(
        fauna.q.CreateIndex({ name: 'find_configuration_by_id', source: fauna.q.Collection('Configurations'), values: [{ field: ['data', 'id'] }] })
    ).then((ret) => console.log(ret)).catch((err) => console.error('Error: [%s] %s: %s', err.name, err.message, err.errors()[0].description,))
}

export default function handler(req, res) {
    const method = req.method;
    const body = req.body;

    switch (method) {
        case "POST":
            // Process a POST request
            FaunaDatabaseInitiations();
            res.status(200).json({ name: 'Initiations Complete' })
            break;
        case "GET":
            // Process a GET request
            break;
    }
}
