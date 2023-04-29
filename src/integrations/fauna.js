let faunadb = require('faunadb');
let q = faunadb.query;

if (!process.env.EDITOR_FAUNA_DATABASE_SERVER_KEY) {
    throw new Error('Add EDITOR_FAUNA_DATABASE_SERVER_KEY to environment keys')
}

let client = new faunadb.Client({
    secret: process.env.EDITOR_FAUNA_DATABASE_SERVER_KEY,
    // NOTE: Use the correct endpoint for your database's Region Group.
    endpoint: 'https://db.fauna.com/',
})

module.exports = { q, client }