import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {

  // Per every page, it implements its SEO details here


  return (
    <Html lang="en">
      <head>
        <title>The Prodoc Documentation Site</title>
        <link rel="stylesheet" href="node_modules/highlight.js/styles/an-old-hope.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/atelier-cave-dark.min.css" />
        {/* <link rel="stylesheet" href="/readme.css" /> */}

      </head>
      <Head />
      <body>
        <Main />
        <NextScript />
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      </body>
    </Html>
  )
}
