var faunadb = require('faunadb');
var q = faunadb.query;

var client = new faunadb.Client({
    secret: process.env.EDITOR_FAUNA_DATABASE_KEY,
    // NOTE: Use the correct endpoint for your database's Region Group.
    endpoint: 'https://db.fauna.com/',
})


export default { q, client };