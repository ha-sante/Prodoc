import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic';

import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge, Spinner, Tooltip, Timeline } from "flowbite-react";
import { Copy, ArrowLeft2, ArrowRight2, Edit } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, pageIdAtom, codeAtom, navigationAtom, ContentAPIHandler, serverAtom, logger
} from '../../context/state';
import { useStore, useAtom } from "jotai";

import toast, { Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const _ = require('lodash');

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

import HTTPSnippet from 'httpsnippet';
import copyToClipboard from 'copy-to-clipboard';
import json5 from 'json5';
import axios from 'axios';
import { diff } from 'deep-object-diff';

import * as LR from "@uploadcare/blocks";
LR.registerBlocks(LR);

const BlocksEditor = dynamic(import('@/components/editor/editor'), { ssr: false });

export default function WalkthroughCreator() {
    const router = useRouter();

    const [content, setContent] = useAtom(contentAtom);
    const [page, setPage] = useAtom(pageAtom);
    const [pageId, setPageId] = useAtom(pageIdAtom);


    const [builder, setBuilder] = useAtom(builderAtom);
    const [edited, setEdited] = useAtom(editedAtom);
    const [steps, setSteps] = useState([]);
    const [render, setRender] = useState(0);
    const [refs, setRefs] = useState(new Map());

    // EXECUTIONS
    useEffect(() => {
        console.log("page.changed", { page, steps })
        if (page.position === "chapter") {
            setSteps([page])
        }
    }, [page]);

    useEffect(() => {
        console.log("steps.changed", { page, steps })
    }, [steps]);

    useEffect(() => {
        // 1. IF LOGO EXISTS, SET IT TO UPLOADER STATE
        // 2. ADD AN EVENT LISTERNER TO SET THE STATE
        // 3. ADD EVENT LISTERNER TO DELETE CURRENT STATE

        typeof window !== undefined && window.addEventListener('LR_UPLOAD_FINISH', (e) => {
            console.log("image.uploader.called", e);
            let cdnURL = e.detail.data[0]?.cdnUrl
            setPage({ ...page, logo: cdnURL ? cdnURL : "" })
        });

        if (page.logo) {
            const api = document.querySelector("lr-upload-ctx-provider");
            console.log("api.data", api.uploadCollection)
            // IF THE COMPONENT DOSENT HAVE ANY IMAGES - SET THE IMAGES FOR IT
            if (api.uploadCollection.size === 0) {
                api.uploadCollection.add({ externalUrl: page.logo });


                var min = render+1;
                var max = 50000
                var random = Math.random() * (max - min) + min;

                setRender(random)
            }
        } else {
            const api = document.querySelector("lr-upload-ctx-provider");
            api.uploadCollection.clearAll();
        }

    }, [pageId]);


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
        setPage({ ...update });

        // HANDLE EDITED STATE
        setEdited(edited);
    }

    const StepBack = () => {
        // POP OFF THE LAST Step
        let local = steps.filter(step => step.id != page?.id);
        let value = _.last(local);

        console.log("stepping.back", { local, value });
        if (value) {
            setPage(value);
            setPageId(value.id)
            setSteps(local);
            setBuilder({ guide: false })
        }
    }

    const stepForward = (page) => {
        let anew = [...steps, page];

        if (edited == false) {
            setSteps(anew);
            setPage(page);
            setPageId(page.id)
        } else {
            let permission = confirm("You have unsaved work on this page, do you still want to move to a new page without saving it?");
            if (permission) {
                setSteps(anew);
                setPage(page);
                setPageId(page.id);
                setEdited(false);
            }
        }

    }

    const AddStepOption = () => {
        console.log("clicked.on.back", { steps, page })
    }

    const HandlePageEdit = (page) => {
        setEdited(true);
    }

    // VIEWS
    const StepIntroduction = useMemo(() => {
        let page = content.find(item => item.id == pageId);

        return (
            <div className='border shadow-sm rounded-lg p-5'>
                <h2 className='mb-3 font-bold'>Step/Selectable Option Editor</h2>

                <div className="flex mt-3 border-t">
                    <div className="p-4 rounded-lg dark:border-gray-700 w-[30%] mx-auto">
                        <p className='mb-2'>Image/Logo</p>
                        <lr-file-uploader-minimal
                            css-src="https://esm.sh/@uploadcare/blocks@0.22.3/web/file-uploader-minimal.min.css"
                            ctx-name="my-uploader"
                            class="my-config"
                            id="step-image-uploader"
                        >
                            <lr-upload-ctx-provider ctx-name="my-uploader"></lr-upload-ctx-provider>

                        </lr-file-uploader-minimal>
                    </div>

                    <div className="p-4 rounded-lg dark:border-gray-700 w-[90%] mx-auto">
                        <p className='mb-2'>Title -  <span className='text-normal text-xs'>A click inviting title e.g (Select the platform you host on) or simply (JavaScript)</span> </p>
                        <TextInput
                            id={"title"}
                            type={"text"}
                            className='w-[100%]'
                            placeholder={`Title`}
                            required={true}
                            key={`${Math.floor((Math.random() * 1000))}-min`}
                            defaultValue={page.title}
                            ref={el => {
                                if (el) {
                                    el.addEventListener('keyup', (e) => {
                                        let value = e.target.value;
                                        setPage({ ...page, title: value });
                                        HandlePageEdit(page);

                                        // TODO: Handle input values of a different type from text
                                        e.target.focus();
                                    });

                                    return setRefs(refs.set("title", el))
                                }

                                return null
                            }}

                        />

                        <p className='mb-2 mt-4'>Description - <span className='text-normal text-xs'>Explain what this step is about e.g (You will be given a code guide per the platform...) </span></p>
                        <TextInput
                            id={"description"}
                            type={"text"}
                            className='w-[100%]'
                            placeholder={`Description`}
                            required={true}
                            defaultValue={page.description}
                            ref={el => {
                                if (el) {
                                    el.addEventListener('keyup', (e) => {
                                        let value = e.target.value;
                                        setPage({ ...page, description: value });
                                        HandlePageEdit(page);

                                        // TODO: Handle input values of a different type from text
                                        e.target.focus();
                                    });

                                    return setRefs(refs.set("description", el))
                                }

                                return null
                            }}
                        />
                    </div>


                </div>
            </div>
        )
    }, [pageId, render]);

    const StepEditorOption = () => {
        return (
            <div>
                {builder?.guide == true ?
                    <div className='border shadow-sm rounded-lg pb-3 mt-3'>
                        <div className="p-5">
                            <div className="flex border-b justify-between pb-3">
                                <h2 className='font-bold'>Step/Selectable Guide Editor</h2>
                                <Button color="gray" pill size={'xs'} onClick={() => {
                                    setBuilder({ ...builder, guide: false })
                                }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>

                        <BlocksEditor EditorOutputHandler={(output) => EditorOutputHandler(output)} />
                    </div>
                    :
                    <div className='p-5 flex justify-between items-center'>
                        <Button color="gray" pill size={'xs'} onClick={() => {
                            setBuilder({ ...builder, guide: true })
                        }}>
                            Add guide +
                        </Button>
                        <p className='text-xs'>This will disable options for this page and render the guide, when it's clicked on as a option.</p>
                    </div>
                }
            </div>
        )
    }

    const OptionsStepper = () => {
        let children = content.filter((item) => page.children.includes(item?.id));
        // console.log("options.stepper.children", children)
        return (
            <div className='mt-3'>
                <Timeline>

                    {children.map((child, index) => {
                        return (
                            <Timeline.Item key={child.id} className='mb-2'>
                                <Timeline.Point />
                                <Timeline.Content>
                                    <Timeline.Time className='flex items-center justify-between'>
                                        {child?.title}

                                        <div className='flex gap-1'>
                                            {/* <Button color="gray" pill size={'xs'} onClick={() => { stepForward(child) }}>
                                                <Edit size="12" color="#ddd" />
                                            </Button> */}
                                            <Button color="gray" pill size={'xs'} onClick={() => { stepForward(child) }}>
                                                <ArrowRight2 size="12" color="#ddd" />
                                            </Button>
                                        </div>

                                    </Timeline.Time>
                                </Timeline.Content>
                            </Timeline.Item>
                        )
                    })}

                </Timeline>

                <Button color="gray" pill size={'xs'} onClick={AddStepOption}>
                    Add Option +
                </Button>
            </div>
        )
    }

    return (
        <div className="flex">

            <div className="p-4 rounded-lg dark:border-gray-700 w-[25%] mx-auto">
                <div className='border shadow-sm rounded-lg p-5'>

                    <div className=''>
                        <h2 className='mb-1 font-bold text-sm'>
                            {page?.position != 'chapter' &&
                                <Button color="gray" className='items-center' pill size={'xs'} onClick={StepBack}>
                                    <ArrowLeft2 size="12" color="#000" /> Back
                                </Button>
                            }
                        </h2>
                        <p className='mb-3 font-medium text-xs'> {page.title} Options</p>
                    </div>

                    <OptionsStepper />
                </div>
            </div>

            <div className="p-4 rounded-lg border-gray-700 w-[75%] mx-auto">
                <div className="flex-column rounded-lg dark:border-gray-700 w-[100%]">
                    <div className="rounded-lg border-gray-700 w-[100%] mx-auto">
                        {StepIntroduction}
                        <StepEditorOption />
                    </div>
                </div>
            </div>

        </div>
    )
}
