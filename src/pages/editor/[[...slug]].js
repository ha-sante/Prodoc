import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic';

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
const BlocksEditor = dynamic(import('@/components/editor/editor'), { ssr: false });

import { DocumentUpload, CloudAdd, CloudPlus } from 'iconsax-react';

export default function Editor() {

  const AppState = useContext(AppStateContext);
  const router = useRouter();
  const { slug } = router.query;

  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [mdxSource, setMdxSource] = useState();

  const [example, setExample] = useState('');


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

            <div className="p-4 w-[80%] mx-auto">
              <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">

                <div className='flex flex-row items-center justify-between mb-3'>
                  <h2 for="helper-text" class="block text-sm font-medium text-gray-900 dark:text-white">Editing Page</h2>
                  <Button size="xs">
                    Save
                    <CloudPlus size="16" className="ml-2" color="#fff"/>
                  </Button>
                </div>

                <div className='border shadow-sm rounded-lg pt-3 pb-3'>
                  <BlocksEditor
                  // onSave={(editorData, title, description) =>
                  //   // onSaveHandler(editorData, title, description)
                  // }
                  />
                </div>

              </div>
            </div>

          </div>

        </div>
      }
    </main>
  )
}
