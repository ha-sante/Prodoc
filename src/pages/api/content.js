const fauna = require('../../integrations/fauna.js');
let q = fauna.q;

export default function handler(req, res) {
    const method = req.method;
    const body = req.body;

    switch (method) {
        case "POST":
            // Process a POST request
            // CREATE A DOCUMENT/PAGE
            fauna.client.query(
                q.Let({
                    create: q.Create(q.Collection('Content'), { data: body }),
                    create_id: q.Select(["ref", "id"], q.Var("create")),
                    update: q.Update(q.Ref(q.Collection('Content'), q.Var('create_id')), { data: { id: q.Var('create_id') } })
                }, q.Var("update"))
            ).then((result) => {
                res.status(200).json(result.data)
            }).catch(error => {
                res.status(404).send(error)
            });
            break;
        case "GET":
            // Process a GET request
            fauna.client.query(
                q.Map(
                    q.Paginate(q.Documents(q.Collection("Content")), { size: 100000 }),
                    q.Lambda("x", q.Get(q.Var("x")))
                )
            ).then(result => {
                let pages = result.data.map(page => page.data);
                res.status(200).send(pages);
            }).catch(error => {
                res.status(404).send(error)
            });
            break;
    }

}