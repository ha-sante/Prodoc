import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { Tabs, Accordion, Card, Button, Modal, TextInput, Textarea, Spinner } from "flowbite-react";
import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

// import { AppStateContext } from '../../../context/state';
import { store } from '../../../context/state';
import { useStore } from "jotai";

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

import JSON5 from 'json5'
import { toast } from 'react-hot-toast';
import axios from 'axios';

const _ = require('lodash');

export default function APIDefinitionsPrompt(props) {
    // const AppState = useContext(AppStateContext);
    const [AppState, setAppState] = useStore(store);

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

    const ReturnHandlingForAllMethods = (data, url, components, paths, method) => {
        return {
            ...AppState.DEFAULT_PAGE_DATA,
            type: "api",
            position: "child",
            title: data?.summary ? data.summary.trim() : url,
            description: data?.description ? data?.description.trim() : "",
            content: {
                ...AppState.DEFAULT_PAGE_DATA?.content,
                api: {
                    endpoint: url,
                    type: method,
                    method: method,
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
    }

    const HandleGenerateAPIPages = () => {
        setProcessing(true);
        let json = JSON5.parse(code);
        console.log("code.data", { json });

        // PREPARE PARENT AND CHILD PAGES FOR STORAGE
        let paths = json?.paths;
        let components = json?.components;
        let { openapi, info, servers, security } = Object(json);

        let methods = ["get", "post", "put", "delete", "patch", "connect", "head", "trace", "options"];
        let pages = [];
        let chapters = [];
        let mappings = {};

        // CREATE ALL CHILD PAGES
        Object.keys(paths).map((url, index) => {
            let endpoint = paths[url];
            methods.map((name) => {
                let data = endpoint[name];
                if (data) {
                    let page = ReturnHandlingForAllMethods(data, url, components, paths, name);

                    page.content.api["configuration"] = {};
                    page.content.api.configuration.servers = servers ? servers : [];
                    page.content.api.configuration.openapi = openapi ? openapi : "";
                    page.content.api.configuration.info = info ? info : {};

                    pages.push(page);
                    page.content.api.tags.map((tag) => {
                        _.has(mappings, tag) ? [] : mappings[tag] = { 'children': [], page: {} };
                        mappings[tag]['children'].push(page);
                    });
                }
            })
        });

        // CREATE PARENT PAGES
        Object.keys(mappings).map((label) => {
            let page = {
                ...AppState.DEFAULT_PAGE_DATA,
                type: "api",
                position: "chapter",
                title: label,
                description: `${label} - Overview Page`,
                content: {
                    ...AppState.DEFAULT_PAGE_DATA?.content,
                    api: {}
                },
            };

            page.content.api["configuration"] = {};
            page.content.api.configuration.servers = servers ? servers : [];
            page.content.api.configuration.openapi = openapi ? openapi : "";
            page.content.api.configuration.info = info ? info : {};

            mappings[label].page = page;
            chapters.push(page);
        })

        toast.success("Converted spec JSON to pages content type.");
        let toastId = toast.loading("Persisting content & creating pages for it.");

        let configuration = { openapi: [json], }
        let bulk = { pages, mappings, chapters, configuration };
        // console.log("all.child.pages", bulk);

        // BULK CREATE THE CONTENT PAGES
        AppState.ContentAPIHandler('PATCH', bulk).then(response => {
            // GET THE NEW CONTENT LIST
            AppState.ContentAPIHandler('GET').then(response => {
                // SET NEW CONTENT
                // AppState.setContent(response.data);
                setAppState({ content: response.data });
                setProcessing(false);
                toast.dismiss(toastId);
                toast.success("Creating/Recreating your api pages complete");
                // AppState.setDefinitions(false);
                setAppState({ definitions: false });
            }).catch(error => {
                console.log('error', error);
                setProcessing(false);
            });
        }).catch(error => {
            console.log('error', error);
            setProcessing(false);
        });
    }

    useEffect(() => {
        setProcessing(false);
    }, []);

    return (
        <div ref={rootRef} className='w-[100%]'>
            <Modal size="2xl" show={AppState.definitions} onClose={() => { setAppState({ definitions: false }); }} popup={true} root={rootRef.current ?? undefined}>

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
                                let value = e.target.value; 2
                                console.log("textinput.value.changed", { value })
                                setCode(value);
                            }}
                            disabled={processing}
                            className='text-sm'
                        />

                    </div>
                </Modal.Body>
                <Modal.Footer className='border-t border pt-4 pb-4'>
                    <Button size={"sm"} onClick={() => { HandleGenerateAPIPages() }} className='flex items-center'>
                        {processing && <Spinner size={'sm'} aria-label="Spinner button example" className='mr-2' />}
                        {processing ? 'Generating & Replacing' : 'Generate & Replace'}
                    </Button>
                    <Button size={"sm"} color="gray" onClick={() => { setProcessing(false); setAppState({ definitions: false }); }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
}