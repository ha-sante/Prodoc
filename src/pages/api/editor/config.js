import database from '../../../integrations/adapters/database';

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

                // ATACH OTHER PROPERTIES FOR USE IN THE FRONTEND
                 result.azure_storage = {
                    account_name: process.env.AZURE_STORAGE_ACCOUNT_NAME,
                    container_name: process.env.AZURE_STORAGE_CONTAINER_NAME,
                    connection_string: process.env.AZURE_STORAGE_CONNECTION_STRING,
                }

                result.uploadcare_storage = {
                    key: process.env.UPLOADCARE_SERVICE_PUBLIC_KEY
                }

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
