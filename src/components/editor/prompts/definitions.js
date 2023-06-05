import { useState, useContext, useRef, useCallback, useEffect } from 'react';
import { Tabs, Accordion, Card, Button, Modal, TextInput, Textarea, Spinner } from "flowbite-react";
import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom,
    DEFAULT_INITIAL_PAGE_BLOCKS_DATA, DEFAULT_PAGE_DATA, ContentAPIHandler
} from '../../../context/state';
import { useStore, useAtom } from "jotai";

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

import JSON5 from 'json5'
import { toast } from 'react-hot-toast';
import axios from 'axios';
import SwaggerParser from "@apidevtools/swagger-parser";
const _ = require('lodash');

export default function APIDefinitionsPrompt(props) {

    const [content, setContent] = useAtom(contentAtom);
    const [definitions, setDefinitions] = useAtom(definitionsAtom);

    const [processing, setProcessing] = useState(false);
    const [code, setCode] = useState('');

    const rootRef = useRef(null);

    const GetEveryPropertyInFull = (reference_path, referenced_object, components) => {
        // console.log("called.GetEveryPropertyInFull", { reference_path, referenced_object, components })
        let local = {};
        Object.keys(referenced_object).map((key) => {
            let ref_value = referenced_object[key];
            local[key] = ref_value; // PREHANDLES FOR WHEN KEY IS NONE OF THE BELOW

            if (key == "$ref") {
                // GET THE REFRENCE DATA POINT
                console.log("ref.value.is.$ref", ref_value);
                let names = ref_value.split("/").splice(2); // - REMOVES #/
                let new_referenced_object = _.get(components, names); // GET THE OBJECT FROM COMPONENTS

                // CHECK IF ANY OF THE PROPERTY VALUES IS OF NAME "$REF"
                let results = GetEveryPropertyInFull(reference_path, new_referenced_object, components);

                // ADD THE NEW OBJECT TO THE OLD
                local = { ...local, ...results };
            }

            // console.warn("local.variable.changed", { local });

            if (_.isPlainObject(ref_value)) {
                // CHECK IF ANY OF THE PROPERTY VALUES IS OF NAME "$REF"
                let results = GetEveryPropertyInFull(reference_path, ref_value, components);
                local[key] = results;
            }

            // console.log("local.variable.changed", { local });
        });
        return local;
    }

    const ReturnHandlingForAllMethods = (data, url, components, paths, method) => {
        return {
            ...DEFAULT_PAGE_DATA,
            type: "api",
            position: "child",
            title: data?.summary ? data.summary.trim() : url,
            description: data?.description ? data?.description.trim() : "",
            content: {
                ...DEFAULT_PAGE_DATA?.content,
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

                    // parameters, requestBody, response
                    // parameters: data?.parameters ? data?.parameters.map((block) => GetEveryPropertyInFull("", block, components)) : [],
                    // requestBody: _.keys(data?.requestBody).map((key) => GetEveryPropertyInFull("", data?.requestBody[key], components)),
                    // responses: _.keys(data?.responses).map((key) => GetEveryPropertyInFull("", data?.responses[key], components)),
                    parameters: data?.parameters ? data?.parameters : [],
                    requestBody: data?.requestBody,
                    responses: data?.responses,
                }
            },
        };
    }

    const HandleGenerateAPIPages = async () => {
        setProcessing(true);
        let json = JSON5.parse(code);
        console.log("code.data", { json });

        try {
            let api = await SwaggerParser.dereference(json);
            console.log("api = ", api)
            // console.log("API name: %s, Version: %s", api.info.title, api.info.version);

            // PREPARE PARENT AND CHILD PAGES FOR STORAGE
            let paths = api?.paths;
            let components = api?.components;
            let { openapi, info, servers, security } = Object(api);

            let methods = ["get", "post", "put", "delete", "patch", "connect", "head", "trace", "options"];
            let pages = [];
            let chapters = [];
            let mappings = {};

            let childLoopRuns = 0;

            // CREATE ALL CHILD PAGES
            Object.keys(paths).map((url, index) => {
                childLoopRuns += 1;
                let endpoint = paths[url];
                // console.log("generated.api.endpoint", { childLoopRuns, endpoint });

                // EACH METHOD - GO OVER THE CHILD PATHS HTTP REQUEST METHODS LISTING
                // - CHECK IF THE PATH HAS A CHILD OF THE TESTED METHOD
                // - IF TRUE, GET A SCHEMA TO DATA SET OF THE PATH HTTP METHOD
                methods.map((name) => {
                    let data = endpoint[name];
                    if (data) {
                        let page = ReturnHandlingForAllMethods(data, url, components, paths, name);
                        // console.log("generated.api.child.page", page);

                        page.content.api["configuration"] = {};
                        page.content.api.configuration.servers = servers ? servers : [];
                        page.content.api.configuration.openapi = openapi ? openapi : "";
                        page.content.api.configuration.info = info ? info : {};
                        page.content.api.configuration.security = security ? security : [];
                        page.content.api.configuration.components = {};
                        page.content.api.configuration.components.securitySchemes = components?.securitySchemes ? components?.securitySchemes : {}; // PICKS AND STORES securitySchemes for closer access
                        pages.push(page);

                        // PAGE TO THEIR PARENT MAPPINGS
                        page.content.api.tags.map((tag) => {
                            _.has(mappings, tag) ? [] : mappings[tag] = { 'children': [], page: {} };
                            mappings[tag]['children'].push(page);
                        });
                    }
                })
            });

            // CREATE PARENT PAGES - NOT REALLY API PAGES
            Object.keys(mappings).map((label) => {
                let page = {
                    ...DEFAULT_PAGE_DATA,
                    type: "api",
                    position: "chapter",
                    title: label,
                    description: `${label} - Overview Page`,
                    content: {
                        ...DEFAULT_PAGE_DATA?.content,
                        api: {}
                    },
                };

                page.content.api["configuration"] = {};
                page.content.api.configuration.servers = servers ? servers : [];
                page.content.api.configuration.openapi = openapi ? openapi : "";
                page.content.api.configuration.info = info ? info : {};
                page.content.api.configuration.security = security ? security : [];

                mappings[label].page = page;
                chapters.push(page);
            })

            toast.success("Converted spec JSON to pages content type.", { position: "bottom-right" });
            let toastId = toast.loading("Persisting content & creating pages for it.", { position: "bottom-right" });

            let configuration = { openapi: [json], }
            let bulk = { pages, mappings, chapters, configuration };
            console.log("generated.api.pages", bulk);

            // BULK CREATE THE CONTENT PAGES
            ContentAPIHandler('PATCH', bulk).then(response => {
                // GET THE NEW CONTENT LIST
                ContentAPIHandler('GET').then(response => {
                    // SET NEW CONTENT
                    setContent(response.data);
                    setProcessing(false);
                    toast.dismiss(toastId);
                    toast.success("Creating/Recreating your api pages complete");
                    setDefinitions(false);
                }).catch(error => {
                    console.log('error', error);
                    toast.error("Error getting all pages content - please try a refresh");
                    toast.dismiss(toastId);
                    setProcessing(false);
                });
            }).catch(error => {
                console.log('error', error);
                toast.error("Bulk api pages persistence and creation failed, error is in logs");
                toast.dismiss(toastId);
                setProcessing(false);
            });

        }
        catch (err) {
            console.error(err);
            toast.error("Something went wrong - Parsing your spec to pages failed. (Check your console for logs)", { position: "bottom-right" });
            setProcessing(false);
        }
    }

    // useEffect(() => {
    //     setProcessing(false);
    // }, []);

    return (
        <div ref={rootRef} className='w-[100%]'>
            <Modal size="2xl" show={definitions} onClose={() => { setDefinitions(false) }} popup={true} root={rootRef.current ?? undefined}>

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
                            id="api-spec-code-area"
                            placeholder="Paste content of Spec File here"
                            onChange={e => {
                                let value = e.target.value; 2
                                console.log("textinput.value.changed", { value })
                                setCode(value);
                            }}
                            disabled={processing}
                            className='text-sm min-h-[400px]'
                            />

                    </div>
                </Modal.Body>
                <Modal.Footer className='border-t border pt-4 pb-4'>
                    <Button size={"sm"} onClick={() => { HandleGenerateAPIPages() }} className='flex items-center'>
                        {processing && <Spinner size={'sm'} aria-label="Spinner button example" className='mr-2' />}
                        {processing ? 'Generating & Replacing' : 'Generate & Replace'}
                    </Button>
                    <Button size={"sm"} color="gray" onClick={() => { setProcessing(false); setDefinitions(false); }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
}