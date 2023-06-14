const fauna = require('../../../integrations/fauna.js');
let q = fauna.q;
import { kv } from "@vercel/kv"; // CACHING LAYER
const _ = require('lodash');
const axios = require('axios');

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

    switch (method) {
        case "GET":
            // Process a GET request
            //http://localhost:3000/api/website/content?integration=readme&slug=https://docs.autharmor.com/docs/getting-started

            // FIRST CHECK IF THE REQUESTER IS REQUESTING CONTENT FROM AN INTEGRATION OR NORMAL PAGE CONTENT
            let integration_content = _.has(params, "integration");
            if (integration_content) {
                // IF FROM AN INTEGRATION - HANDLE IT.
                let integration = params.integration;
                let config = await fauna.client.query(q.Get(q.Ref(q.Collection('Configuration'), "1")));

                switch (integration) {
                    case "readme":
                        let page = params.page;
                        let slug = "";
                        let endpoint = "https://dash.readme.com/api/v1/api-specification";
                        // HANDLE README INTEGRATED CONTENT
                        return axios.get(endpoint, {
                            Headers: {
                                "accept": "application/json",
                                "authorization": `Basic ${config.data.readme}`
                            }
                        }).then((result) => {
                            res.status(200).send(result);
                        }).catch((error) => {
                            // console.log("content.get.readme.get.error", error)
                            res.status(404).send({ message: "Was unable to get this document", config: config.data, error })
                        })

                }
            } else {
             
            }
            console.log("request.method.not.supported", method);
            res.status(404).send({ message: "Request method not supported" });
            break;

        }

}
