import Image from 'next/image'
import Head from 'next/head';

import { Inter } from 'next/font/google'
import { useState, useEffect, useContext, useRef, useLayoutEffect, useMemo, memo } from "react";
import { useRouter } from 'next/router'

import { Label, TextInput, Checkbox, Button, Alert, Avatar, Spinner } from "flowbite-react";
import axios from 'axios';
import { ArrowSquareRight, ArrowRight2, TickSquare } from 'iconsax-react';

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

    // 1.
    // ON LOAD, GET THE SLUG
    // - PER SLUG, CALL FOR WALKTHROUGH CONTENT
    // - GET THE WALKTHROUGH OBJECT PER THE SLUG
    // 2.
    // - WE TRACE BACK FROM THAT OBJECT TO ITS UTMOST PARENT OBJECT
    // - WE THEN PUSH THIS INTO THE STEPS LIST
    // 3.
    // - RENDER THE FOUND WALKTHROUGH TUTORIAL

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
            <div className={`p-4 flex justify-center items-center min-h-screen polka-background ${render_body == false ? "-mt-10" : ""}`}>
                <div className='text-left shadow p-32 w-2/3 bg-white justify-center'>

                    <div className='flex gap-3 items-stretch mx-auto'>
                        <div className='w-[10%]'>
                            {page?.logo && <Avatar img={page?.logo} className='' width="200px" />}
                        </div>
                        <div className='w-[90%]'>
                            <h1 className='text-4xl'>{page?.title}</h1>
                            <p className='mt-5 text-sm'>{page?.description}</p>

                            <div className='flex gap-2 mx-auto mt-5'>
                                {options && options.map((step) => {
                                    return (
                                        <div key={step.id} className='flex flex-col items-center shadow rounded-sm p-4 cursor-pointer' onClick={() => {
                                            setPage(step);
                                            setSteps([...steps, step]);
                                        }}>

                                            <div className='w-[100%]'>
                                                {step?.logo && <Avatar img={step?.logo} className='mb-3' height="10px" width="10px" />}
                                            </div>

                                            <div className='w-[100%] text-center mt'>
                                                <p className='text-sm'> {step.title} </p>
                                            </div>

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

    const Navbar = () => {
        let render_body = _.isEmpty(page?.content?.editor) === false;

        return (
            <div className='bg-white h-[60px] w-100 shadow sticky p-5 pr-20 pl-20 top-0 z-10 flex items-center justify-between'>

                <div className='w-[30%] justify-start'>
                    {<img src={"https://ucarecdn.com/84f42343-490a-4927-ac1c-5c8ff2b26aab/autharmorconsumerblack.svg"} className="" width="150px" height="auto" />}
                </div>

                <div className='flex !justify-center items-center gap-2 mx-auto w-[40%]'>
                    {steps.map((step, index) => {
                        return (<span key={step.id} className={`rounded-full !w-[70px] !h-[5px] p-1 cursor-pointer ${page?.id == step.id ? "bg-gray-200" : "bg-gray-200"}`} onClick={() => { setPage(step); setSteps(steps.filter((item, itemIndex) => itemIndex <= index)); }}>  </span>)
                    })}
                </div>

                <div className='w-[30%] text-right flex justify-end'>
                    {render_body ?
                        <Button className='border-none items-center' color="light"> Complete Onboarding  <TickSquare className='ml-3' size="16" color="#000000" /> </Button>
                        :
                        <Button className='border-none' color="light"> Skip Onboarding </Button>
                    }
                </div>

            </div>
        )
    }

    return (
        <div>
            <Navbar />
            <main className="min-h-screen bg-white walkthrough">
                {processing ? <PageLoadingIndication /> : page && <WalkthroughThis />}
            </main>
        </div>
    )
}
