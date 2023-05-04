import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic';

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from 'next/router'

import { Label, TextInput, Checkbox, Button, Alert, Avatar, Modal } from "flowbite-react";
import axios from 'axios';

import EditorSidebar from '@/components/editor/sidebar';
import APIBuilder from '@/components/editor/builder';
import ConfigurePrompt from '@/components/editor/prompts/configure';
import DefinitionsPrompt from '@/components/editor/prompts/definitions';

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
import { AppStateContext } from '../../context/state';

import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'

const BlocksEditor = dynamic(import('@/components/editor/editor'), { ssr: false });

import { DocumentUpload, CloudAdd, CloudPlus, ArrowLeft2, CloudChange } from 'iconsax-react';
import ReactPlayer from 'react-player'
import toast, { Toaster } from 'react-hot-toast';

export default function Editor() {

  const AppState = useContext(AppStateContext);
  const router = useRouter();
  const { slug } = router.query;
  const [password, setPassword] = useState('');
  const [mdxSource, setMdxSource] = useState();
  const [example, setExample] = useState('');
  const [processing, setProcessing] = useState(false);

  const authenticate = () => {
    let toastId = toast.loading('Authenticating...');
    axios.post('/api/auth', { password }).then(response => {
      toast.dismiss(toastId);
      toast.success("Welcome 👋🏄‍♂️👍");
      localStorage.setItem("authenticated", true);
      AppState.setAuthenticated(true);
    }).catch(error => {
      console.log(error);
      toast.error('Invalid auth details.');
      toast.dismiss(toastId);
      AppState.setAuthenticated(false);
    });
  };

  const editorOnSaveHandler = (editor, title, description) => {
    console.log("Editor Data to Save::", { editor, title, description });

    // UPDATE THE ACTUAL CONTENT STATE WITH THE NEW DATA WE ARE GETTING + THE PAGE BLOCK CURRENTLY SET
    let index = AppState.content.findIndex(page => page.id == AppState?.page?.id);
    let anew = AppState.content;
    anew[index] = { ...anew[index], title, description, content: { editor, mdx: '' } };
    AppState.setContent(anew);
    AppState.setEdited(true);
  }

  const handlePageConfigChange = (configuration) => {
    console.log("handling.change.via.props", { configuration });

    let newContent = [...AppState.content];
    let current_in_edit_page_index = AppState.content.findIndex((page) => AppState?.page?.id == page.id);
    let page = AppState.content.find((page) => AppState?.page?.id == page.id);

    newContent[current_in_edit_page_index] = { ...page, configuration };

    AppState.setContent(newContent);
    AppState.setConfigure(false);
    AppState.setEdited(true);
  }

  const handleSavePageData = () => {
    // GET THE DATA FOR THE UPDATED PAGE 
    let page = AppState.content.find(page => page.id == AppState?.page?.id);
    if (page) {
      setProcessing(true);
      let toastId = toast.loading('Saving this Page...');
      AppState.ContentAPIHandler('PUT', page).then(response => {
        // AppState.setContent(response.data);
        console.log('response', response.data);
        AppState.setEdited(false);
        setProcessing(false);
        toast.dismiss(toastId);
        toast.success("Page Updated");
      }).catch(error => {
        console.log('error', error);
        setProcessing(false);
      });
    }
  }

  const computeMDXContent = () => {
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
  }

  useEffect(() => {
    // makes a request to the authentication child 
    let valid = localStorage.getItem("authenticated");
    console.log("authenticated", valid);
    if (valid) {
      AppState.setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    let route_data = { slug, page: router.query.page };
    console.log("route.change.data", route_data);

    // LOAD CONTENT IF WE ARE AT EDITOR/(SOMETHING)
    if (Array.isArray(route_data.slug)) {

      if (AppState.content.length == 0) {
        // GET ALL CONTENT
        AppState.ContentAPIHandler('GET').then(response => {
          console.log('get.all.content', { content: response.data, page_id: router.query.page });
          AppState.setContent(response.data);

          // IF WE ARE AT A SUB PAGE E.G /PRODUCT...
          if (route_data.page != undefined) {
            let page = response.data.find(page => page.id == route_data.page);
            console.log("slug.page.matched", { page });
            AppState.setPage({ ...page });
            AppState.setEdited(false);
          } else {
            // AppState.setPage();
          }

        }).catch(error => {
          console.log('error', error);
        })
      }

      // IF WE ARE AT A SUB PAGE E.G /PRODUCT...
      if (route_data.page != undefined) {
        let page = AppState.content.find(page => page.id == route_data.page);
        console.log("slug.page.matched", { page });
        AppState.setPage({ ...page });
        AppState.setEdited(false);
        // page is not there
      } else {
        // AppState.setPage();
      }

    }

  }, [slug]);

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

  function EditorPage() {
    return (
      <div className="p-4 pt-2 sm:ml-64 flex flex-row justify-between">

        {AppState.page?.id !== undefined && AppState.page?.type == "product" ?
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">

              <div className='border shadow-sm rounded-lg pt-3 pb-3'>
                <BlocksEditor
                  onSave={(editorData, title, description) =>
                    editorOnSaveHandler(editorData, title, description)
                  }
                />
              </div>

            </div>
          </div>
          :
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">

              <div className='flex flex-row items-center justify-between mb-3 mt-6 text-center'>
                <p class="block text-sm font-normal text-gray-900 dark:text-white flex flex-row items-center">
                  <ArrowLeft2 size="16" className="mr-2" />
                  Click/Create a new page to start editing
                </p>
              </div>

            </div>
          </div>
        }

      </div>
    )
  }

  function APIPage() {
    return (
      <div className="p-4 pt-2 sm:ml-64 flex flex-row justify-between">

        {AppState.page?.id !== undefined && AppState.page?.type == "api" ?
          <div className="p-4 w-[100%] mx-auto">
            <APIBuilder />
          </div>
          :
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">

              <div className='flex flex-row items-center justify-between mb-3 mt-6 text-center'>
                <p class="block text-sm font-normal text-gray-900 dark:text-white flex flex-row items-center">
                  <ArrowLeft2 size="16" className="mr-2" />
                  Click/Create a new page to start editing
                </p>
              </div>

            </div>
          </div>
        }

      </div>
    )
  }

  function HomePage() {
    return (
      <div className="p-5 pt-0 sm:ml-64 flex flex-row justify-between">

        <div className="p-4 w-[60%] mx-auto">
          <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">

            <div className='flex flex-row items-center justify-between mb-3'>
              <h2 for="helper-text" class="block text-lg font-medium text-gray-900 dark:text-white">Welcome Home 👋</h2>
            </div>

            <div className='border shadow-sm rounded-lg p-3 w-auto'>
              <ReactPlayer width={'100%'} url='https://www.youtube.com/watch?v=zAS9Dpf7YuM' />
            </div>


            <div className='mt-3 p-3 text-left'>

              <div className='flex'>
                <Avatar
                  img="https://pbs.twimg.com/profile_images/1531031797252882433/YCkCRjKe_400x400.jpg"
                  rounded={true}
                  bordered={true}
                />
              </div>
              <p className='pt-2 text-sm'>
                Welcome to Prodoc, an open source product and api documentation tool.
                My name is Henry and I am the first author of the prodoc open source tool.</p>

              <p className='pt-2 text-sm'>
                I built Prodoc as a solution to the lack of customizability offered in current documentation tools.
                I built it, given I already had experience with building content systems. I am the founder of another productivity tool for content management.
              </p>

              <p className='pt-2 text-sm'>
                My goal with Prodoc is for everyone to have a solid tool to setup their documentation websites and to get the best
                of both worlds whiles doing it.
                I hope you enjoy and if anything, do reach out to the Open Source team
                <a href="https://github.com/ha-sante/Prodoc" target='_blank' className='underline'> here</a> (Opens in new tab).
              </p>


              <p className='pt-2 text-sm'>
                This place will be replaced with analytics data soon. 📊
              </p>
            </div>


          </div>
        </div>

      </div>
    )
  }

  function Navigation() {
    return (
      <div className="p-2 sm:ml-64 sticky top-0 z-10">
        <div className="p-5 border-b-2 border-gray-200 w-[100%] mx-auto !bg-white border-dashed dark:border-gray-700">

          <div className='flex flex-row items-center justify-between'>
            <h2 for="helper-text" class="block text-sm font-medium text-gray-900 dark:text-white">Editing Page</h2>

            <div className='flex flex-row'>
              <Button size="xs" className="mr-4" disabled={true} color="light" onClick={() => handleSavePageData()}>
                Import (Coming Soon)
              </Button>

              <Button size="xs" className="mr-4" color="light" onClick={() => AppState.setConfigure(true)}>
                Configure
              </Button>

              {AppState.edited ?
                <Button size="xs" isProcessing={processing} color="warning" onClick={() => handleSavePageData()}>
                  Save Page Data Update
                  <CloudChange size="16" className="ml-2" color="#fff" />
                </Button>
                :
                <Button size="xs" isProcessing={processing} onClick={() => handleSavePageData()}>
                  Save Page Data
                  <CloudPlus size="16" className="ml-2" color="#fff" />
                </Button>
              }

            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="min-h-screen flex-col items-center border justify-between">
        <ConfigurePrompt key={"configure-prompt-1"} HandleConfigurationChange={handlePageConfigChange} />
        <DefinitionsPrompt key={"definitions-prompt"} definitions={AppState.definitions} setDefinitions={AppState.setDefinitions} />

        {!AppState.authenticated ?
          AuthenticationPage()
          :
          <div className="w-100">
            {slug == undefined ?
              <div className="w-100">
                <EditorSidebar />
                {HomePage()}
              </div>
              :
              <div className="w-100">
                {AppState.page?.id !== undefined && Navigation()}
                <EditorSidebar />
                {AppState.navigation === 'api' ? APIPage() : EditorPage()}
              </div>
            }
          </div>
        }
      </main>
    </>
  )
}
