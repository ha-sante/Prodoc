// GETS PAGE CONTENT FOR BOTH EDITOR AND LANDING PAGES

export default function handler(req, res) {
    const method = req.method;
    const body = req.body;

    console.log(process.env.EDITOR_PASSWORD);

    switch (method) {
        case "POST":
            // Process a POST request
            if (body.password === process.env.EDITOR_PASSWORD) {
                res.status(200).json({ name: 'Authenticated' })
            } else {
                res.status(404).json({ name: 'Not Found' })
            }
            break;
        case "GET":
            // Process a GET request
            break;
    }
}
