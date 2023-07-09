let faunadb = require('faunadb');
let q = faunadb.query;

if (!process.env.FAUNA_DATABASE_SERVER_KEY) {
    console.log('Add FAUNA_DATABASE_SERVER_KEY to environment keys')
}

let client = new faunadb.Client({
    secret: process.env.FAUNA_DATABASE_SERVER_KEY,
    // NOTE: Use the correct endpoint for your database's Region Group.
    endpoint: 'https://db.us.fauna.com/',
    timeout: 180 // increase to 30 minutes
})

module.exports = { q, client }