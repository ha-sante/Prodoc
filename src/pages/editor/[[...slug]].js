import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from 'next/router'


import { Label, TextInput, Checkbox, Button, Alert, Avatar } from "flowbite-react";
import axios from 'axios';

import EditorSidebar from '@/components/editor/sidebar';

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import { AppStateContext } from '../../context/state';

import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
const components = { Alert, Avatar }

// import { BlockNoteEditor } from "@blocknote/core";
// import { BlockNoteView, useBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";

// import EditorJS from '@editorjs/editorjs';
import { createReactEditorJS } from 'react-editor-js'


import EditingEditor from '@/components/editor/editing';


// tools.js
// import Embed from '@editorjs/embed'
// import Table from '@editorjs/table'
// import Paragraph from '@editorjs/paragraph'
// import List from '@editorjs/list'
// import Warning from '@editorjs/warning'
// import Code from '@editorjs/code'
// import LinkTool from '@editorjs/link'
// import Image from '@editorjs/image'
// import Raw from '@editorjs/raw'
// import Header from '@editorjs/header'
// import Quote from '@editorjs/quote'
// import Marker from '@editorjs/marker'
// import CheckList from '@editorjs/checklist'
// import Delimiter from '@editorjs/delimiter'
// import InlineCode from '@editorjs/inline-code'
// import SimpleImage from '@editorjs/simple-image'

const EDITOR_JS_TOOLS = {
  // NOTE: Paragraph is default tool. Declare only when you want to change paragraph option.
  // paragraph: Paragraph,
  // embed: Embed,
  // table: Table,
  // list: List,
  // warning: Warning,
  // code: Code,
  // linkTool: LinkTool,
  // image: Image,
  // raw: Raw,
  // header: Header,
  // quote: Quote,
  // marker: Marker,
  // checklist: CheckList,
  // delimiter: Delimiter,
  // inlineCode: InlineCode,
  // simpleImage: SimpleImage,
}


let blocks = [
  {
    id: "mhTl6ghSkV",
    type: "paragraph",
    data: {
      text: "Hey. Meet the new Editor. On this picture you can see it in action. Then, try a demo 🤓",
    },
  },
  {
    id: "l98dyx3yjb",
    type: "header",
    data: {
      text: "Key features",
      level: 3,
    },
  },
];

export default function Editor() {

  const AppState = useContext(AppStateContext);
  const router = useRouter();
  const { slug } = router.query;

  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [mdxSource, setMdxSource] = useState();

  const [example, setExample] = useState('');


  const ReactEditorJS = createReactEditorJS()
  const ejInstance = useRef();

  // const initEditor = () => {
  //   const editor = new EditorJS({
  //     holder: 'editorjs',
  //     onReady: () => {
  //       ejInstance.current = editor;
  //     },
  //     autofocus: true,
  //     data: DEFAULT_INITIAL_DATA,
  //     onChange: async () => {
  //       let content = await editor.saver.save();

  //       console.log(content);
  //     }
  //   });
  // };

  // const DEFAULT_INITIAL_DATA = {
  //   "time": new Date().getTime(),
  //   "blocks": [
  //     {
  //       "type": "header",
  //       "data": {
  //         "text": "This is my awesome editor!",
  //         "level": 1
  //       }
  //     },
  //   ]
  // }

  useEffect(() => {
    // if (ejInstance.current === null) {
    //   initEditor();
    // }

    // return () => {
    //   ejInstance?.current?.destroy();
    //   ejInstance.current = null;
    // };
  }, []);


  const authenticate = () => {
    axios.post('/api/auth', { password }).then(response => {
      alert("Welcome 👋🏄‍♂️👍")
      localStorage.setItem("authenticated", true);
      setAuthenticated(true);
    }).catch(error => {
      alert(error);
      setAuthenticated(false);
    });
  };

  useEffect(() => {
    // makes a request to the authentication child 
    let valid = localStorage.getItem("authenticated");
    console.log("authenticated", valid);
    if (valid) {
      setAuthenticated(true);
    }
  }, []);


  useEffect(() => {
    // IF THE PAGE CHANGES
    // GET THE PAGE_ID
    // FIND ITS DATA
    // TRANSFORM ITS CONTENT FIELD
    // SET IT AS DATA
    // MDX text - can be from a local file, database, anywhere
    const EditorEditing = async () => {
      const source = `Some **mdx** text, with a component 
      <Avatar
      img="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
      rounded={true}
      bordered={true}/>


      ## Welcome to Auth Armor! 👋

      Getting started is easy.

      ### Sign up

      First, head over to  and sign-up or login.

      Once you have signed up, a project is created for you. You can create unlimited projects. Each project has its own collection of users, API keys and settings.

      ### Create a project

      After creating a project, you need to integrate Auth Armor to your project. This can be done multiple ways. We have several libraries and SDKs you can use to get started quickly. 

      Learn more about the dashboard here: 

      ### Integrate

      The main concepts are the JavaScript Client SDK and the Backend API.

      The JavaScript Client SDK enables a quick and easy way to add authentication and registration forms to your website, app, or login page. 

      learn more about the JavaScript SDK here: 

      The backend API is a collection of all the APIs you need to register, authenticate and authorize users. We have multiple libraries that wrap the API in your preferred language.

      Learn more about the Backend API here: 
        `
      setExample(source);

      const mdxSource = await serialize(source, {
        mdxOptions: {
          remarkPlugins: [],
          rehypePlugins: [],
          development: process.env.NODE_ENV === 'development',
        },
      })
      setMdxSource(mdxSource)
    }

    EditorEditing();
  }, [slug]);


  useEffect(() => {
    const EditorEditing = async () => {
      const source = example;

      try {
        const mdxSource = await serialize(source, {
          mdxOptions: {
            remarkPlugins: [],
            rehypePlugins: [],
            development: process.env.NODE_ENV === 'development',
          },
        })

        setMdxSource(mdxSource)
      } catch (error) {
        console.log("error.generating.mdx.page", error);
        // Expected output: ReferenceError: nonExistentFunction is not defined
        // (Note: the exact output may be browser-dependent)
      }

    }

    EditorEditing();
  }, [example]);

  function AuthenticationPage() {
    return (
      <div className="w-[50vw] lg:w-96 mx-auto mt-60">
        <h2 className='mb-3'>Welcome Editor 👋</h2>
        <div className="flex flex-col gap-4">
          <div>
            <TextInput
              id="password"
              type="password"
              placeholder="process.env.EDITOR_PASSWORD = ?"
              required={true}
              className='[&_input]:rounded-none'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className='rounded-none' onClick={authenticate}>
            Login as an Editor
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex-col items-center border justify-between">
      {!authenticated ?
        AuthenticationPage()
        :
        <div className="w-100">

          <button data-drawer-target="default-sidebar" data-drawer-toggle="default-sidebar" aria-controls="default-sidebar" type="button" className="inline-flex items-center p-2 mt-2 ml-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
            <span className="sr-only">Open sidebar</span>
            <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
            </svg>
          </button>

          <EditorSidebar />

          <div className="p-4 sm:ml-64 flex flex-row justify-between">

            <div className="p-4 w-[70%] mx-auto">
              <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">

                <div className='flex flex-row items-center justify-between mb-3'>
                  <h2 for="helper-text" class="block text-sm font-medium text-gray-900 dark:text-white">Page Editing is achieved using MDX</h2>
                  <Button size="xs">Save</Button>
                </div>

                {/* <input type="text" id="helper-text"
                  aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border font-medium border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Page Title"
                />

                <input type="text" id="helper-text"
                  aria-describedby="helper-text-explanation"
                  className="bg-gray-10 mt-3 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Page Description"
                /> */}

                {/* <label for="helper-text" class="block mb-2 mt-4 text-sm font-normal text-gray-900 dark:text-white">Page Content</label> */}


                {false && <form>
                  <div class="w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">

                    <div class="flex items-center justify-between px-3 py-2 border-b dark:border-gray-600">
                      <div class="flex flex-wrap items-center divide-gray-200 sm:divide-x dark:divide-gray-600">
                        <div class="flex items-center space-x-1 sm:pr-4">
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Attach file</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Embed map</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Upload image</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Format code</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Add emoji</span>
                          </button>
                        </div>
                        <div class="flex flex-wrap items-center space-x-1 sm:pl-4">
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Add list</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Settings</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Timeline</span>
                          </button>
                          <button type="button" class="p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                            <span class="sr-only">Download</span>
                          </button>
                        </div>
                      </div>
                      <button type="button" data-tooltip-target="tooltip-fullscreen" class="p-2 text-gray-500 rounded cursor-pointer sm:ml-auto hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                        <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd"></path></svg>
                        <span class="sr-only">Full screen</span>
                      </button>
                      <div id="tooltip-fullscreen" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                        Show full screen
                        <div class="tooltip-arrow" data-popper-arrow></div>
                      </div>
                    </div>

                    <div class="px-4 py-2 bg-white rounded-b-lg dark:bg-gray-800">
                      {/* <label for="editor" class="sr-only">Publish post</label> */}
                      <textarea id="editor" value={example} onInput={(event) => {
                        setExample(event.target.value);
                      }} rows="8" class="block w-full px-0 text-sm text-gray-800 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400" placeholder="Write an article..." required></textarea>
                    </div>

                  </div>
                  {/* <button type="submit" class="inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800">
                    Publish post
                  </button> */}
                </form>}

                {/* <div className="editorjs" id="editorjs">

                </div> */}

                {/* <ReactEditorJS defaultValue={blocks} tools={EDITOR_JS_TOOLS} /> */}


                <EditingEditor
                  // onSave={(editorData, title, description) =>
                  //   // onSaveHandler(editorData, title, description)
                  // }
                />

              </div>
            </div>

            {/* <div className="p-4 w-[50%]">
              <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">

                <div className='flex flex-row items-center justify-between mb-3'>
                  <h2 for="helper-text" class="block text-sm font-medium text-gray-900 dark:text-white">Page Preview</h2>
                  <h2 for="helper-text" class="block text-sm font-normal text-gray-900 dark:text-white">This is how it will look when rendered</h2>
                </div>

                <hr className='mb-2' />

                <div className='content-preview'>
                  {mdxSource && <MDXRemote {...mdxSource} components={components} />}
                </div>

              </div>
            </div> */}

          </div>

        </div>
      }
    </main>
  )
}
