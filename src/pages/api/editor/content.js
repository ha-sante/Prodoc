const fauna = require('../../../integrations/services/fauna.js');
import redis from '../../../integrations/services/redis';
import utils from '../../../integrations/services/utils';
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

    // CACHING CONTENT
    // - Empty array with objects
    // - POST adds ontop of
    // - GET reads and sends it to requester
    // - DELETE reads, delete that object and resets the data
    // - PATCH replaces the whole key with the newly generated content

    // DATA STRUCTURE OF CHOICE - LISTS
    let pages = new database.PagesDatabaseHandler(body, params); // THE BELOW FUNCTIONS ALREADY HAVE ACCESS THROUGH THIS SETUP

    switch (method) {
        case "POST":
            try {
                let created = await pages.create();
                res.status(200).send(created)
            } catch (error) {
                res.status(404).send(error)
            }
            break;
        case "GET":
            try {
                let result = await pages.get();
                res.status(200).send(result);
            } catch (error) {
                res.status(404).send(error)
            }
            break;
        case "PUT":
            try {
                let result = await pages.put();
                res.status(200).send(result);
            } catch (error) {
                res.status(404).send(error)
            }
            break;
        case "DELETE":
            try {
                let result = await pages.delete();
                res.status(200).send(result);
            } catch (error) {
                res.status(404).send(error)
            }
            break;
        case "PATCH":
            try {
                let result = await pages.patch();
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
