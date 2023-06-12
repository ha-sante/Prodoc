import Image from 'next/image'
import Head from 'next/head';

import { Inter } from 'next/font/google'
import { useState, useEffect, useContext, useRef, useLayoutEffect, useMemo, memo } from "react";
import { useRouter } from 'next/router'

import { Label, TextInput, Checkbox, Button, Alert, Avatar, Spinner } from "flowbite-react";
import axios from 'axios';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom, pageIdAtom, ContentAPIHandler, StorageHandler, logger,
    EditorPageContentRenderer,
} from '../../context/state';
import { useStore, useAtom, useSetAtom } from "jotai";

import Output from 'editorjs-react-renderer';

const inter = Inter({ subsets: ['latin'] })

const _ = require('lodash');

export default function Walkthrough() {

    const router = useRouter();
    const { slug } = router.query;

    const [processing, setProcessing] = useState(false);
    const [page, setPage] = useState();
    const [steps, setSteps] = useState([]);
    const [content, setContent] = useState([]);

    // ON LOAD, GET THE SLUG
    // - PER SLUG, CALL FOR CONTENT
    // - GET THE WALKTHROUGH OBJECT
    // - RENDER THE WALKTHROUGH TUTORIAL

    useEffect(() => {
        console.log("page.slug", slug);
        if (slug) {
            setProcessing(true);
            // GET ALL CONTENT ANEW
            ContentAPIHandler('GET').then(response => {
                let identifier = slug[0];
                let content = response.data;
                let walkthrough_content = content.filter(item => item.type == "walkthroughs");
                let page = walkthrough_content.find(item => item.configuration.seo.slug == identifier);
                console.log('response', { response, page, content });
                setProcessing(false);
                setContent([...content]);
                setPage(page);
                setSteps([page]);
            }).catch(error => {
                setProcessing(false);
                console.log('error', error);
            })
        }
    }, [slug]);

    const PageLoadingIndication = () => {
        return (
            <div className='text-center min-h-screen flex justify-center items-center border w-full'>
                <div className='text-center'>
                    <Spinner
                        aria-label="Extra large spinner example"
                        size="xl"
                    />
                    <h2 className='mt-3 font-medium text-gray-500'>Walkthrough Loading</h2>
                </div>
            </div>
        )
    }

    const WalkthroughThis = () => {
        let options = page?.children.map(child_id => content.find(child => child.id == child_id)).filter(item => item != undefined);
        let render_body = _.isEmpty(page?.content?.editor) === false;

        console.log("options", options);
        console.log("steps", steps);

        return (
            <div className="p-4 flex justify-center items-center min-h-screen bg-gray-100 polka-background">
                <div className='text-left shadow p-32 w-2/3 bg-white justify-center'>

                    <div className='flex !justify-center items-center gap-2 mb-10'>
                        {steps.map((step, index) => {
                            return (<span key={step.id} className='rounded-full bg-gray-200 !w-[70px] !h-[5px] p-1 cursor-pointer' onClick={() => { setPage(step); setSteps(steps.filter((item, itemIndex) => itemIndex <= index)); }}>  </span>)
                        })}
                    </div>

                    <div className='flex gap-3 items-stretch mx-auto'>
                        <div className='w-[10%]'>
                            {page?.logo && <Avatar img={page?.logo} className='' rounded width="200px" />}
                        </div>
                        <div className='w-[90%]'>
                            <h1 className='text-4xl animate__animated animate__fadeInUp'>{page?.title}</h1>
                            <p className='mt-5 text-sm animate__animated animate__fadeInUp'>{page?.description}</p>

                            <div className='flex gap-2 mx-auto mt-5'>
                                {options && options.map((step) => {
                                    return (
                                        <div key={step.id} className='border rounded p-4 cursor-pointer' onClick={() => {
                                            setPage(step);
                                            setSteps([...steps, step]);
                                        }}>
                                            <p className='text-sm'> {step.title} </p>
                                        </div>
                                    )
                                })}
                            </div>

                            <div>
                                {render_body && EditorPageContentRenderer(page?.content?.editor)}
                            </div>

                        </div>
                    </div>


                </div>
            </div>
        )
    }

    return (
        <div>
            <Head>
                <link rel="stylesheet" href="node_modules/highlight.js/styles/an-old-hope.css"/>
            </Head>
            <main className="min-h-screen bg-white walkthrough">
                {processing ? <PageLoadingIndication /> : <WalkthroughThis />}
            </main>
        </div>
    )
}
