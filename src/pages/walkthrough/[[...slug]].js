import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useState, useEffect, useContext, useRef, useLayoutEffect, useMemo, memo } from "react";
import { useRouter } from 'next/router'

import { Label, TextInput, Checkbox, Button, Alert, Avatar, Spinner } from "flowbite-react";
import axios from 'axios';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom, pageIdAtom, ContentAPIHandler, StorageHandler, logger
} from '../../context/state';
import { useStore, useAtom, useSetAtom } from "jotai";


const inter = Inter({ subsets: ['latin'] })

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
            }).catch(error => {
                setProcessing(false);
                console.log('error', error);
            })
        }
    }, [slug]);


    const PageLoadingIndication = () => {
        return (
            <div className='text-center h-screen flex justify-center items-center border w-full'>
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


        console.log("options", options);

        return (
            <div className="p-4 flex justify-center items-center h-screen bg-gray-100 polka-background">
                <div className='text-left shadow rounded-lg p-32 w-2/3 bg-white justify-center glass-background'>

                    <div className='flex gap-3 items-stretch mx-auto'>
                        {page?.logo &&
                            <div className='w-[10%]'>
                                <Avatar img={page?.logo} className='' rounded width="200px" />
                            </div>
                        }
                        <div className='w-[90%]'>
                            <h1 className='text-4xl'>{page?.title}</h1>
                            <p className='mt-5 text-sm'>{page?.description}</p>


                            <div className='flex gap-2 mx-auto mt-5'>
                                {options && options.map((step) => {
                                    return (
                                        <div key={step.id} className='border rounded p-4 cursor-pointer'>
                                            <p className='text-sm'> {step.title} </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-white">
            {processing ? <PageLoadingIndication /> : <WalkthroughThis />}
        </main>
    )
}
