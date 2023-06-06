import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge, Spinner, Tooltip } from "flowbite-react";
import { Copy, DocumentCopy, Setting2 } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom, ContentAPIHandler, serverAtom, logger
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

import * as LR from "@uploadcare/blocks";
LR.registerBlocks(LR);


export default function WalkthroughCreator() {
    const [page, setPage] = useAtom(pageAtom);
    const [builder, setBuilder] = useAtom(builderAtom);
    const router = useRouter();


    // VIEWS
    const StepIntroduction = () => {

        return (
            <div className='border shadow-sm rounded-lg p-5'>
                <h2 className='mb-3 font-bold'>You are currently editing an option of the page Named One</h2>

                <div className="flex mt-3 border-t">
                    <div className="p-4 rounded-lg dark:border-gray-700 w-[30%] mx-auto">
                        <p className='mb-2'>Image/Logo</p>
                        <lr-file-uploader-minimal
                            css-src="https://esm.sh/@uploadcare/blocks@0.22.3/web/file-uploader-minimal.min.css"
                            ctx-name="my-uploader"
                            class="my-config"
                        >
                        </lr-file-uploader-minimal>
                    </div>
                    <div className="p-4 rounded-lg dark:border-gray-700 w-[90%] mx-auto">
                        <p className='mb-2'>A click inviting title - (e.g Select the platform you want to monitor)</p>
                        <TextInput
                            id={"title"}
                            type={"text"}
                            className='w-[100%]'
                            placeholder={`Title`}
                            required={true}
                            defaultValue={""}
                            ref={el => {
                                // logger.log("body.input.element", { el });
                                // if (el) {
                                //     el.addEventListener('keyup', (e) => {
                                //         let path = e.target.id.split("'");
                                //         let value = e.target.value;

                                //         // logger.log("input.value.changed.before.builder", builder);
                                //         // let local = builder;
                                //         // let update = _.set(local, path, value);
                                //         // setBuilder({ ...update });
                                //         // logger.log("input.value.changed.after.builder", builder);


                                //         e.target.focus();
                                //     });

                                //     return setBodyRefs(bodyRefs.set(pathName, el))
                                // }

                                // return null
                            }
                            }
                        />

                        <p className='mb-2 mt-4'>Description - <span className='text-normal text-xs'>Explain what this step is about e.g <span className='font-medium italic'> Set up a separate project for each part of your application (for example, your API server and frontend client),
                                to quickly pinpoint which part of your application errors are coming from.</span></span></p>
                        <TextInput
                            id={"title"}
                            type={"text"}
                            className='w-[100%]'
                            placeholder={`Title`}
                            required={true}
                            defaultValue={""}
                            ref={el => {
                                // logger.log("body.input.element", { el });
                                // if (el) {
                                //     el.addEventListener('keyup', (e) => {
                                //         let path = e.target.id.split("'");
                                //         let value = e.target.value;

                                //         // logger.log("input.value.changed.before.builder", builder);
                                //         // let local = builder;
                                //         // let update = _.set(local, path, value);
                                //         // setBuilder({ ...update });
                                //         // logger.log("input.value.changed.after.builder", builder);


                                //         e.target.focus();
                                //     });

                                //     return setBodyRefs(bodyRefs.set(pathName, el))
                                // }

                                // return null
                            }
                            }
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-column">

            <div className="p-4 rounded-lg dark:border-gray-700 w-[80%] mx-auto">
                <StepIntroduction />
            </div>

            <div className="p-4 rounded-lg dark:border-gray-700 w-[80%] mx-auto">

            </div>

        </div>
    )
}
