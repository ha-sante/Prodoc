import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic';

import { useState, useEffect, useContext, useRef, useLayoutEffect, useMemo, memo } from "react";
import { useRouter } from 'next/router'

import { Label, TextInput, Checkbox, Button, Alert, Avatar, Modal } from "flowbite-react";
import axios from 'axios';

import EditorSidebar from '@/components/editor/sidebar';
import APIBuilder from '@/components/editor/builder';
import ConfigurePrompt from '@/components/editor/prompts/configure';
import DefinitionsPrompt from '@/components/editor/prompts/definitions';
const BlocksEditor = dynamic(import('@/components/editor/editor'), { ssr: false });
import WalkthroughCreator from '@/components/editor/creator';


import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import {
  store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
  editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom, pageIdAtom, ContentAPIHandler, StorageHandler, logger
} from '../../context/state';
import { useStore, useAtom, useSetAtom } from "jotai";

import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'


import { DocumentUpload, CloudAdd, CloudPlus, ArrowLeft2, CloudChange } from 'iconsax-react';
import ReactPlayer from 'react-player'
import toast, { Toaster } from 'react-hot-toast';

import { diff } from 'deep-object-diff';


export default function Editor() {

  const [content, setContent] = useAtom(contentAtom);

  const [pagination, setPagination] = useAtom(paginationAtom);
  const [page, setPage] = useAtom(pageAtom);
  // const setPageId = useSetAtom(pageIdAtom);
  const [pageId, setPageId] = useAtom(pageIdAtom);

  const [builder, setBuilder] = useAtom(builderAtom);

  const [configure, setConfigure] = useAtom(configureAtom);
  const [edited, setEdited] = useAtom(editedAtom);
  const [authenticated, setAuthenticated] = useAtom(authenticatedAtom);
  const [permission, setPermission] = useAtom(permissionAtom);
  const [definitions, setDefinitions] = useAtom(definitionsAtom);

  const [code, setCode] = useAtom(codeAtom);
  const [navigation, setNavigation] = useAtom(navigationAtom);


  const router = useRouter();
  const { slug } = router.query;
  const [password, setPassword] = useState('');
  const [mdxSource, setMdxSource] = useState();
  const [example, setExample] = useState('');
  const [processing, setProcessing] = useState(false);


  // FUNCTIONS
  const authenticate = () => {
    let toastId = toast.loading('Authenticating...');
    axios.post('/api/auth', { password }).then(response => {
      toast.dismiss(toastId);
      toast.success("Welcome 👋🏄‍♂️👍");
      typeof window !== undefined && localStorage.setItem("authenticated", true);
      setAuthenticated(true);
    }).catch(error => {
      logger.error(error);
      toast.error('Invalid auth details.');
      toast.dismiss(toastId);
      setAuthenticated(true);
    });
  };


  function ElementText(element) {
    // HANDLE THE SECOND BLOCK
    var html = element;
    var div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  function PageSearchEngineOptimization() {

  }

  const EditorOutputHandler = (output) => {
    console.log("Editor Data to Save::", { output });

    // FIND IF IT'S DIFFERENT FROM WHAT IS STORED IN CONTENT PAGE
    let difference = Object.keys(diff(output, page?.content?.editor));
    let edited = false;
    console.log("editor.output.difference", difference);
    if (difference.length == 1 && difference[0] == "time") {
      edited = false;
    } else {
      edited = true;
    }

    // UPDATE THE PAGE WITH THIS NEW DATA
    let local = page;
    let update = _.set(local, ["content", "editor"], output);


    // HANDLE TITLE & DESCRIPTION BLOCKS
    let first_block_text = ElementText(output.blocks[0]?.data?.text);
    let second_block_text = ElementText(output.blocks[1]?.data?.text);

    // HANDLE THEIR FINAL DATAS
    let title = first_block_text ? first_block_text : "Documentation Page";
    let description = second_block_text ? second_block_text : "Page Description here";

    setPage({ ...update, title, description });

    // HANDLE EDITED STATE
    setEdited(edited);
  }


  const handleSavePageData = () => {
    // GET THE DATA FOR THE UPDATED PAGE 
    // let page = content.find(page => page.id == page?.id);
    if (page) {
      setProcessing(true);
      let toastId = toast.loading('Saving this Page...');
      ContentAPIHandler('PUT', page).then(response => {

        // SET IT IN CONTENT LOADING
        let contentAnew = [...content]
        let currentPageIndex = content.findIndex(item => item.id == page?.id);
        contentAnew[currentPageIndex] = page;

        logger.log('response', response.data);
        setEdited(false);
        setProcessing(false);
        StorageHandler.set(`edited`, false);
        setContent(contentAnew);
        toast.dismiss(toastId);
        toast.success("Page Updated");

      }).catch(error => {
        logger.log('error', error);
        setProcessing(false);
        toast.dismiss(toastId);
        toast.error("Something went wrong - Page was not saved");
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
    logger.log("page.or.content.changed", { page, content })
  }, [page, content]);

  useEffect(() => {
    // makes a request to the authentication child 
    let valid = typeof window !== undefined && localStorage.getItem("authenticated") ? true : false;
    logger.log("authenticated", valid);
    if (valid) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    let nav = { slug, page: router.query.page };
    logger.log("slug.url.changed", { nav });

    // - /PRODUCT OR /API LOADS : (GET ALL CONTENT AT THIS POINT)
    // - /PRODUCT/PAGE (NO CONTENT) : (GET ALL CONTENT) (FROM THE RESPONSE CHECK FOR THE PAGE)
    // - /product/page (content) : (FIND THE PAGE)

    // CHECK FOR PAGE NAVIGATION
    if (Array.isArray(nav.slug)) {

      // SET OUR NAVIGATION VIEW
      if (navigation !== slug[0]) {
        setNavigation(slug[0]);
      }

      // IF AT THE MAIN ENTRY ONLY (/product or /api)
      if (nav.page == null) {
        let toastId = toast.loading('Getting Pages Content...');

        // GET ALL CONTENT ANEW
        ContentAPIHandler('GET').then(response => {

          // SET THE NEW CONTENT
          logger.log('get.all.content', { content: response.data, page_id: router.query.page });
          setContent(response.data);
          toast.dismiss(toastId);

          // SET THE CURRENT PAGE WE ARE ON
          if (nav.page != undefined) {
            let found = response.data.find(page => page.id == nav.page);
            console.log("slug.page.matched.content.new.load", { found });
            setPage(found);
            setPageId(found.id);
            setEdited(false);
            StorageHandler.set(`edited`, false);
          }

        }).catch(error => {
          logger.log('error', error);
          toast.dismiss(toastId);
          toast.error('Recieved an error whiles getting pages content');
        })
      }

      // IF AT A CHILD PAGE
      if (nav.page != null) {
        // IF NO CONTENT
        if (content.length == 0) {
          let toastId = toast.loading('Getting Pages Content...');

          // GET ALL CONTENT ANEW
          ContentAPIHandler('GET').then(response => {
            logger.log('get.all.content', { content: response.data, page_id: router.query.page });

            // SET THE NEW CONTENT
            setContent(response.data);
            toast.dismiss(toastId);

            // SET THE CURRENT PAGE WE ARE ON
            if (nav.page != undefined) {
              let found = response.data.find(page => page.id == nav.page);
              console.log("slug.change.new.page", { page });
              setPage(found);
              setPageId(found.id);
              setEdited(false);
              StorageHandler.set(`edited`, false);
            }
          }).catch(error => {
            logger.log('error', error);
            toast.dismiss(toastId);
            toast.error('Recieved an error whiles getting pages content');
          })
        }

        // IF CONTENT EXISTS
        if (content.length > 0) {
          let found = content.find(page => page.id == nav.page);
          console.log("page.loaded.from.current.content", { found });
          setPage(found);
          setPageId(found.id);
          setEdited(false);
          StorageHandler.set(`edited`, false);
        }
      }

    } else {
      if (navigation != 'main') {
        setNavigation('main');
      }
    }
  }, [slug]);


  // COMPONENTS
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
    let render_editor = page != undefined && pageId != undefined && content.length > 0;

    console.log("editor.page.reload.called", { page, authenticated, render_editor })

    return (
      <div className="p-4 pt-2 sm:ml-64 flex flex-row justify-between">

        {render_editor ?
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">
              <div className='border shadow-sm rounded-lg pt-3 pb-3'>
                <BlocksEditor EditorOutputHandler={(output) => EditorOutputHandler(output)} />
              </div>
            </div>
          </div>
          :
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">
              <div className='flex flex-row items-center justify-between mb-3 mt-6 text-center'>
                <p className="text-sm font-normal text-gray-900 dark:text-white flex flex-row items-center">
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

        {page?.id !== undefined && page?.type == "api" ?
          <div className="p-4 w-[100%] mx-auto">
            <APIBuilder />
          </div>
          :
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">

              <div className='flex flex-row items-center justify-between mb-3 mt-6 text-center'>
                <p className="text-sm font-normal text-gray-900 dark:text-white flex flex-row items-center">
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

  function WalkthroughsPage() {
    return (
      <div className="p-4 pt-2 sm:ml-64 flex flex-row justify-between">

        {page?.id !== undefined && page?.type == "walkthroughs" ?
          <div className="p-4 w-[100%] mx-auto">
            <WalkthroughCreator/>
          </div>
          :
          <div className="p-4 w-[80%] mx-auto">
            <div className="p-4 rounded-lg dark:border-gray-700">

              <div className='flex flex-row items-center justify-between mb-3 mt-6 text-center'>
                <p className="text-sm font-normal text-gray-900 dark:text-white flex flex-row items-center">
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

            <div className='flex flex-row items-center justify-between'>
              <h2 className="block text-lg font-medium text-gray-900 dark:text-white">Welcome to Prodoc 👋</h2>
              <p>Home will be updated soon.</p>
            </div>

          </div>
        </div>
      </div>
    )
  }

  function Navigation() {
    // logger.log("editor.navigation.bar.rendered")
    return (
      <div className="p-2 sm:ml-64 sticky top-0 z-10">
        <div className="p-5 border-b-2 border-gray-200 w-[100%] mx-auto !bg-white border-dashed dark:border-gray-700">

          <div className='flex flex-row items-center justify-between'>
            <h2 className="block text-sm font-medium text-gray-900 dark:text-white">Editing Page</h2>

            <div className='flex flex-row'>
              <Button size="xs" className="mr-4" disabled={true} color="light" onClick={() => handleSavePageData()}>
                Import (Coming Soon)
              </Button>

              <Button size="xs" className="mr-4" color="light" onClick={() => setConfigure(true)}>
                Configure
              </Button>

              {edited ?
                <Button size="xs" color="warning" onClick={() => handleSavePageData()}>
                  Save Page Data Update
                  <CloudChange size="16" className="ml-2" color="#fff" />
                </Button>
                :
                <Button size="xs" onClick={() => handleSavePageData()}>
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
    <main className="min-h-screen flex-col items-center justify-between">
      <ConfigurePrompt key={"configure-prompt"} />
      <DefinitionsPrompt key={"definitions-prompt"} definitions={definitions} setDefinitions={setDefinitions} />

      {authenticated === false ?
        AuthenticationPage()
        :
        <div className="w-100">
          {slug == null ?
            <div className="w-100">
              <EditorSidebar />
              {HomePage()}
            </div>
            :
            <div className="w-100">
              {page?.id !== undefined && Navigation()}
              <EditorSidebar />
              {navigation === 'api' && APIPage()}
              {navigation === 'product' && EditorPage()}
              {navigation === 'walkthroughs' && WalkthroughsPage()}
            </div>
          }
        </div>
      }
    </main>
  )
}
