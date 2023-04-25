import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/router'


import { Label, TextInput, Checkbox, Button } from "flowbite-react";
import axios from 'axios';

import EditorSidebar from '@/components/editor/sidebar';

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import { AppStateContext } from '../../context/state';

import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'

export default function Editor() {

  const AppState = useContext(AppStateContext);
  const router = useRouter();
  const { slug } = router.query;

  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

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

          <div className="p-4 sm:ml-64">
            <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">

              <MDXRemote {...source} components={components} />

            </div>
          </div>

        </div>
      }
    </main>
  )
}
