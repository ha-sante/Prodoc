## Prodoc
Prodoc is an open source product and API documentation tool. It enables you to own and customize your documentation site as if it's a part of your product offering. For those who understand, your documentation site is another powerful tool for converting users and getting them excited and informed about using your tool, Prodoc is for you.


## Features
- [x] Editor Panel (Product Documentation)
- [x] Editor Panel (API Documentation)
- [x] Editor Panel (Walkthrough Experiences)
- [ ] Docs Website Sections

- [ ] Content Versioning
- [ ] SDK Documentation

## Contributing
- prodoc-demo.vercel.app




<FilePond
files={files}
onupdatefiles={setFiles}
allowMultiple={false}
maxFiles={1}
// LOAD THE FILE PASSED IN
// load={(source, load, error, progress, abort, headers) => {
//   let file = files.find(el => el.file == source)
//   var myRequest = new Request(source);
//   fetch(myRequest).then(function (response) {
//     response.blob().then(function (myBlob) {
//       load(myBlob);
//     });
//   })
// }
// }
// UPLOAD THE SET FILE

// server="/api"
name="files" /* sets the file input name, it's filepond by default */
labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
/>