// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export const config = {
  api: {
      responseLimit: '4mb',
      bodyParser: {
          sizeLimit: '4mb',
      },
  },
};

export default function handler(req, res) {
  const method = req.method;
  const body = req.body;
  
  console.log(process.env.EDITOR_PASSWORD);

  switch (method) {
    case "POST":
      console.log("req.body = ", body.password);
      // Process a POST request
      if (body.password === process.env.EDITOR_PASSWORD) {
        res.status(200).json({ name: 'Authenticated' })
      } else {
        res.status(404).json({ name: 'Not Found' })
      }
      break;
  }
}


