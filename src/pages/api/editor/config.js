const fauna = require('../../../integrations/services/fauna.js');
// const redis = require('../../../integrations/services/redis.js');
import redis from '../../../integrations/services/redis';

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
    

    switch (method) {
        case "GET":
            // Process a GET request
            return fauna.client.query(q.Get(q.Ref(q.Collection('Configuration'), "1"))).then((result) => {
                res.status(200).send(result.data);
            }).catch(error => {
                console.log("get.content.error", error);
                res.status(404).send(error)
            });

            break;
        case "PUT":
            // Process a PUT request
            try {
                let configured = await fauna.client.query(q.Update(q.Ref(q.Collection('Configuration'), "1"), { data: { ...body } }));
                res.status(200).send(configured.data);
            } catch (error) {
                console.log("api.config.put.error", error);
                res.status(404).send(error);
            }

            break;
        default:
            console.log("request.method.not.supported", method);
            res.status(404).send({ message: "Request method not supported" });
    }

}
