
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
            res.status(200).send({ message: "Hello", env: process.env })
            break;
    }
}
