import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { Tabs, Accordion, Card, Button, Modal, TextInput, Textarea, Spinner } from "flowbite-react";
import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import { AppStateContext } from '../../../context/state';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

import JSON5 from 'json5'
import { toast } from 'react-hot-toast';
import axios from 'axios';

var _ = require('lodash');

export default function APIDefinitionsPrompt(props) {
    const AppState = useContext(AppStateContext);
    const [code, setCode] = useState('');
    const [processing, setProcessing] = useState(false);
    const rootRef = useRef(null);
    const [temp, setTemp] = useState({});

    const GetEveryPropertyInFull = (reference_path, referenced_object, components) => {
        console.warn("called.GetEveryPropertyInFull", { reference_path, referenced_object, components })
        // CHECK IF ANY OF ITS CHILDREN KEYS ARE OBJECTS WITH REFERENCE 
        let local = {};
        Object.keys(referenced_object).map((key) => {
            let ref_value = referenced_object[key];
            console.warn("local.variable.changed", { local });
            local[key] = ref_value;

            if (key == "$ref") {
                // GET THE REFRENCE DATA POINT
                let names = ref_value.split("/").splice(2);
                let new_referenced_object = _.get(components, names);
                // CHECK IF ANY OF THE PROPERTY VALUES IS OF NAME "$REF"
                let results = GetEveryPropertyInFull(reference_path, new_referenced_object, components);

                local = { ...local, ...results };
            }
            console.warn("local.variable.changed", { local });

            if (_.isPlainObject(ref_value)) {
                // CHECK IF ANY OF THE PROPERTY VALUES IS OF NAME "$REF"
                let results = GetEveryPropertyInFull(reference_path, ref_value, components);
                local[key] = results;
            }
            console.warn("local.variable.changed", { local });
        });
        return local;
    }

    const HandleGenerateAPIPages = () => {
        setProcessing(true);
        let json = JSON5.parse(code);
        console.log("code.data", { json });

        // PREPARE PARENT AND CHILD PAGES FOR STORAGE
        let paths = json?.paths;
        let components = json?.components;
        Object.keys(paths).map((url, index) => {
            let endpoint = paths[url];
            // console.log("going.through.endpoint", endpoint)
            if (endpoint["get"]) {
                // console.log("going.through.get.endpoint", endpoint["get"])
                let data = endpoint["get"];
                let page = {
                    ...AppState.DEFAULT_PAGE_DATA,
                    type: "api",
                    position: "child",
                    title: data?.summary ? data.summary : url,
                    description: data?.description ? data?.description : "",
                    content: {
                        ...AppState.DEFAULT_PAGE_DATA.content,
                        api: {
                            tags: data?.tags ? data?.tags : [],
                            deprecated: data?.deprecated ? data?.deprecated : false,
                            operationId: data?.operationId ? data?.operationId : '',
                            externalDocs: data?.externalDocs ? data?.externalDocs : {},
                            callbacks: data?.callbacks ? data?.callbacks : {},
                            security: data?.security ? data?.security : [],
                            servers: data?.servers ? data?.servers : [],

                            parameters: data?.parameters ? data?.parameters.map((block) => GetEveryPropertyInFull("", block, components)) : [],
                            responses: _.keys(data?.responses).map((key) => GetEveryPropertyInFull("", data?.responses[key], components)),
                            requestBody: _.keys(data?.requestBody).map((key) => GetEveryPropertyInFull("", data?.requestBody[key], components)),
                            // parameters,
                            // requestBody,
                            // responses,
                        }
                    },
                };

                // HANDLE PARAMETERS (REFRENCE OR RAW DEFINED)
                // if (data?.parameters) {
                //     let refreshed = [];
                //     // HANDLE EVERY PURE & REFERENCED OBJECT TOGETHER
                //     data?.parameters.map((block, index) => {
                //         let mapped = GetEveryPropertyInFull("", block, components);
                //         refreshed.push(mapped);
                //     });

                //     // console.log("parameters.refreshed", { refreshed });
                //     page.content.api.parameters = refreshed;
                // }

                // // HANDLE WHEN RESPONSES
                // if (data?.responses) {
                //     let refreshed = [];
                //     // HANDLE EVERY PURE & REFERENCED OBJECT TOGETHER
                //     Object.keys(data?.responses).map((key, index) => {
                //         let block = data?.responses[key];
                //         let mapped = GetEveryPropertyInFull("", block, components);
                //         refreshed.push(mapped);
                //     });

                //     // console.log("responses.refreshed", { refreshed });
                //     page.content.api.responses = refreshed;
                // }

            }

            if (endpoint["post"]) {
                console.log("going.through.post.endpoint", endpoint["post"])
                let data = endpoint["post"];
                let page = {
                    ...AppState.DEFAULT_PAGE_DATA,
                    type: "api",
                    position: "child",
                    title: data?.summary ? data.summary : url,
                    description: data?.description ? data?.description : "",
                    content: {
                        ...AppState.DEFAULT_PAGE_DATA.content,
                        api: {
                            tags: data?.tags ? data?.tags : [],
                            deprecated: data?.deprecated ? data?.deprecated : false,
                            operationId: data?.operationId ? data?.operationId : '',
                            externalDocs: data?.externalDocs ? data?.externalDocs : {},
                            callbacks: data?.callbacks ? data?.callbacks : {},
                            security: data?.security ? data?.security : [],
                            servers: data?.servers ? data?.servers : [],
                            // parameters,
                            // requestBody,
                            // responses,
                        }
                    },
                };

                // HANDLE PARAMETERS (REFRENCE OR RAW DEFINED)
                if (data?.parameters) {
                    let refreshed = [];
                    // HANDLE EVERY PURE & REFERENCED OBJECT TOGETHER
                    data?.parameters.map((block, index) => {
                        let mapped = GetEveryPropertyInFull("", block, components);
                        refreshed.push(mapped);
                    });

                    console.log("parameters.refreshed", { refreshed });
                    page.content.api.parameters = refreshed;
                }

                // HANDLE WHEN RESPONSES
                if (data?.responses) {
                    let refreshed = [];
                    // HANDLE EVERY PURE & REFERENCED OBJECT TOGETHER
                    Object.keys(data?.responses).map((key, index) => {
                        let block = data?.responses[key];
                        let mapped = GetEveryPropertyInFull("", block, components);
                        refreshed.push(mapped);
                    });

                    console.log("responses.refreshed", { refreshed });
                    page.content.api.responses = refreshed;
                }

                // HANDLE WHEN REQUEST BODY
                if (data?.requestBody) {
                    let refreshed = [];
                    // HANDLE EVERY PURE & REFERENCED OBJECT TOGETHER
                    Object.keys(data?.requestBody).map((key, index) => {
                        let block = data?.requestBody[key];
                        let mapped = GetEveryPropertyInFull("", block, components);
                        refreshed.push(mapped);
                    });

                    console.log("requestBody.refreshed", { refreshed });
                    page.content.api.requestBody = refreshed;
                }

            }

            if (endpoint["put"]) {

            }

            if (endpoint["delete"]) {

            }

            if (endpoint["patch"]) {

            }

            if (endpoint["delete"]) {

            }

            if (endpoint["connect"] || endpoint["head"] || endpoint["trace"] || endpoint["options"]) {

            }
        })

    }


    useEffect(() => {
        setProcessing(false);
    }, []);

    return (
        <div ref={rootRef} className='w-[100%]'>
            <Modal size="2xl" show={AppState.definitions} onClose={() => { AppState.setDefinitions(false); }} popup={true} root={rootRef.current ?? undefined}>

                <Modal.Header className='text-sm !p-5 !pb-0'>
                    <p>Create API Pages </p>
                </Modal.Header>

                <Modal.Body>
                    <div className="space-y-2">

                        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Spec Files supported (Swagger & Open-API 3.0.0 {'>or='} )
                        </p>

                        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Groupings is achieved using Endpoint Tags, else The bare URLs.
                        </p>

                        <Textarea
                            type="text"
                            value={code}
                            id="code-area"
                            placeholder="Paste content of Spec File here"
                            onChange={e => {
                                let value = e.target.value;
                                console.log("textinput.value.changed", { value })
                                setCode(value);
                            }}
                            disabled={processing}
                            className='text-sm'
                        />

                    </div>
                </Modal.Body>
                <Modal.Footer className='border-t border pt-4 pb-4'>
                    <Button size={"sm"} onClick={() => { HandleGenerateAPIPages() }}>
                        {processing && <Spinner size={'sm'} aria-label="Spinner button example" className='mr-2' />}
                        {processing ? 'Generating' : 'Generate'}
                    </Button>
                    <Button size={"sm"} color="gray" onClick={() => { setProcessing(false); AppState.setDefinitions(false) }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
}