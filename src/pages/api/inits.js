const fauna = require('./fauna.js');

function FaunaDatabaseInitiations() {
    // CREACTE COLLECTIONS - ACCOUNTS, CONTENT, CONFIGURATIONS
    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Accounts' })
    ).then((ret) => console.log(ret)).catch((err) => console.error(
        'Error: [%s] %s: %s',
        err.name,
        err.message,
        err.errors()[0].description,
    ));

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Content' })
    ).then((ret) => console.log(ret)).catch((err) => console.error(
        'Error: [%s] %s: %s',
        err.name,
        err.message,
        err.errors()[0].description,
    ));

    fauna.client.query(
        fauna.q.CreateCollection({ name: 'Configurations' })
    ).then((ret) => console.log(ret)).catch((err) => console.error(
        'Error: [%s] %s: %s',
        err.name,
        err.message,
        err.errors()[0].description,
    ));


    // CREATE INDEXES - find_(object)_by_id
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
