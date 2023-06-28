const fauna = require('../../../integrations/services/fauna.js');
import database from '../../../integrations/adapters/database';


let q = fauna.q;
const _ = require('lodash');

export const config = {
    api: {
        responseLimit: '50mb',
        bodyParser: {
            sizeLimit: '100mb',
        },
    },
};


export default async function handler(req, res) {
    const method = req.method;
    const body = req.body;
    const params = req.query;
    console.log("recieved.request", { method, params, body });

    // HOW IT WORKS
    // - GET GETS THE CONFIG WORK

    let config = new database.ConfigDatabaseHandler(body, params); // THE BELOW FUNCTIONS ALREADY HAVE ACCESS THROUGH THIS SETUP

    switch (method) {
        case "GET":
            try {
                let result = await config.get();
                res.status(200).send(result);
            } catch (error) {
                res.status(404).send(error)
            }
            break;
        case "PUT":
            try {
                let result = await config.put();
                res.status(200).send(result);
            } catch (error) {
                res.status(404).send(error)
            }
            break;
        default:
            console.log("request.method.not.supported", method);
            res.status(404).send({ message: "Request method not supported" });
    }

}
