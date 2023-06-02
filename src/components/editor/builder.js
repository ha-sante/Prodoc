import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge, Spinner } from "flowbite-react";
import { Copy, DocumentCopy } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom,
    DEFAULT_INITIAL_PAGE_BLOCKS_DATA, DEFAULT_PAGE_DATA, ContentAPIHandler
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

export default function BuilderEditor() {
    const [page, setPage] = useAtom(pageAtom);
    const [code, setCode] = useAtom(codeAtom);
    // const [builder, setBuilder] = useAtom(builderAtom);

    const router = useRouter();
    const [environments, setEnvironments] = useState([
        { logo: "/editor/curl.svg", name: "cURL", target: "shell", client: '' },
        { logo: "/editor/javascript.svg", name: "JavaScript", target: "javascript", client: "fetch" },
        { logo: "/editor/python.svg", name: "Python", target: "python", client: '' },
        { logo: "/editor/node.svg", name: "Node.js", target: "node", client: '' },
        { logo: "/editor/go.svg", name: "Golang", target: "go", client: '' },
        { logo: "/editor/ruby.svg", name: "Ruby", target: "ruby", client: '' },
    ]);
    const [selected, setSelected] = useState(0);
    const [refs, setRefs] = useState(new Map());
    const [response, setResponse] = useState("// Rendering of your request response");
    const [viewer, setViewer] = useState('demo');
    const [demoIndex, setDemoIndex] = useState(0);
    const [demo, setDemo] = useState("");
    const [processing, setProcessing] = useState(false);
    const [serverURL, setServerURL] = useState('');
    const [paramRefs, setParamRefs] = useState(new Map());
    const [builder, setBuilder] = useState({});

    const SendRequest = () => {
        // SEND THE REQUEST - WITH PARAMS AND BODY
        // LOAD THE RESPONSE - INTO RESPONSE AS A JSON STRING
        setProcessing(true);
        let request = {
            baseURL: serverURL, // SERVER ENDPOINT
            url: page?.content?.api?.endpoint,
            method: page?.content.api.method
        }
        // HANDLE PARAMETERS
        let parameters = builder.parameters;
        if (parameters.path) {
            _.mapKeys(parameters.path, function (value, key) {
                let new_endpoint = _.replace(request.url, `{${key}}`, value);
                if (new_endpoint) {
                    request.url = new_endpoint;
                }
            });
        }
        if (parameters.header) {
            request.headers = parameters.header;
        }
        if (parameters.query) {
            request.params = parameters.query;
        }


        axios({
            method: 'post',
            url: '/user/12345',
            data: {
                firstName: 'Fred',
                lastName: 'Flintstone'
            },
            params: {
                ID: 12345
            },
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
    }

    const RenderCodeArea = (index) => {
        let environment = environments[index !== undefined ? index : selected];
        let template = ``;

        if (page) {

            // GET FORM DATA
            let { body, parameters } = Object(builder);
            let { header, path, query } = Object(parameters);
            let base = page?.content.api?.configuration?.servers[0].url;
            let endpoint = page?.content.api.endpoint;

            let har_format = {
                method: "POST",
                url: `${base}${endpoint}`,
                cookies: [],
                queryString: [],
                postData: {},
                headers: [],
            };


            // HANDLE PATH
            if (path) {
                // FOR THE ENDPOINT
                // CHECK FOR EVERY WORD SARROUNDED BY {}
                // REPLACE IT BY IT'S EQUIVALENT IN PATH
                _.mapKeys(path, function (value, key) {
                    let new_endpoint = _.replace(endpoint, `{${key}}`, value);
                    if (new_endpoint) {
                        har_format.url = base + new_endpoint;
                    }
                });
            }
            // console.log({ har_format, endpoint })

            // HANDLE HEADER
            if (header) {
                _.mapKeys(header, function (value, key) {
                    if (value) {
                        har_format.headers.push({
                            name: key,
                            value: value,
                            comment: ""
                        })
                    }
                });
            }

            // HANDLE QUERY
            if (query) {
                _.mapKeys(query, function (value, key) {
                    if (value) {
                        har_format.queryString.push({
                            name: key,
                            value: `${value}`,
                        })
                    }
                });
            }

            // HANDLE BODY
            if (body) {
                har_format.postData = {
                    "mimeType": "application/json",
                    "params": [],
                    "text": JSON.stringify(body)
                }
            }

            const snippet = new HTTPSnippet(har_format);
            const options = { indent: '\t' };

            try {
                const output = snippet.convert(environment.target.toLowerCase(), environment.client, options);
                // console.log(output);
                if (output) {
                    setCode(output);
                }
            } catch (error) {
                console.log("error.generating.code.example", { error });
            }

        }
    }
    useEffect(() => {
        setBuilder(null);
        RenderCodeArea();
        setProcessing(false);
        setServerURL(page?.content?.api?.configuration?.servers[0].url);
    }, [page]);

    useEffect(() => {
        let responses = _.keys(page?.content?.api?.responses).map(key => {
            return ({
                code: key,
                data: page?.content?.api?.responses[key]
            })
        });
        console.log("response", responses);

        const random = {
            choice: (array) => {
                return array[Math.floor(Math.random() * array.length)];
            },
            randint: (min, max) => {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            uniform: (min, max) => {
                return Math.random() * (max - min) + min;
            }
        };

        function generateFakeData(schema) {
            let data = {};
            if (schema.properties) {
                Object.keys(schema.properties).map((key, index) => {
                    let property = schema.properties[key];
                    let type = property.type;
                    // console.log("schema.loop", { property, type });
                    if (type === 'string') {
                        data[key] = random.choice(['foo', 'bar', 'baz']);
                    } else if (type === 'integer') {
                        data[key] = random.randint(0, 100);
                    } else if (type === 'float') {
                        data[key] = random.uniform(0, 100);
                    } else if (type === 'boolean') {
                        data[key] = random.choice([true, false]);
                    } else if (type === 'array') {
                        let fake_array_data = generateFakeData(schema.properties[key].items);
                        // console.log("fake_array_data", fake_array_data);
                        data[key] = [fake_array_data];
                    } else if (type === 'object') {
                        let results = generateFakeData(property);
                        // console.log("fake_object_data.results", results);
                        data[key] = { ...results };
                    } else {
                        // console.log("property.type.not.mapped", { schema, type, property });
                        // throw new Error(`Unknown type: ${type}`);
                    }
                })
            }
            return data;
        }

        let results = "";

        responses.map((response, index) => {
            _.keys(response.data?.content).map((contentType, index) => {
                let schema = response.data.content[contentType].schema;
                results += `//${contentType} \n ${json5.stringify(generateFakeData(schema), undefined, 4)} \n \n`;
            })
        })

        setDemo(results);
    }, [page, demoIndex]);

    const Indicators = (page) => {
        // IF THE VALUE IS API
        // RETURN A INDICATOR OF 
        if (page.type == "api" && page.content.api.type) {
            let colors = { get: "success", post: "info", put: "indigo", delete: "failure", patch: "warning" }
            return <Badge color={colors[page.content.api.type]} className='inline rounded-full'>{page.content.api.type}</Badge>
        }
    }

    const Formations = ({ fields, paths }) => {
        let input_mappings = { string: "text", integer: "number", object: "text" };
        // console.log("Formations", { paths, fields });

        // SET THE STATE FOR ALL THE OBJECT PROPERTIES NAMES AT THE PATH
        if (_.isPlainObject(fields)) {
            // GO OVER EACH MEMBER WITH OBJECT.KEYS
            // RENDER AN INPUT FOR THEM IF THEY ARE OF TYPE STRING
            // IF OBJECT, RETURN THIS FUNCTION
            return (
                <div>
                    {Object.keys(Object.fromEntries(Object.entries(fields).sort())).map((key, index) => {
                        let block = fields[key];
                        block.name = key; // set fields name to its's key
                        //console.warn("block", block);

                        // IF TREE, HAS AN OBJECT AGAIN, LOOP THROUGH THAT
                        if (_.isPlainObject(block?.properties)) {
                            let new_paths = paths + `/${block.name}`;
                            //console.log("block.is.of.type.object", { new_paths, block })
                            return (
                                <div className='mb-2' key={key}>
                                    <p className='text-black flex flex-row items-center'>{block.name}
                                        <span className='ml-2 text-xs font-normal text-gray-400'>{block.type}</span>
                                    </p>
                                    <div className='ml-4 mt-2'>
                                        <Formations fields={block?.properties} paths={new_paths} />
                                    </div>
                                </div>
                            )
                        }

                        // ELSE, RENDER THE FORM BLOCK AS RECIEVED
                        let builder_path_label = key; // GET THE CURRENT END OF THE STICK WE ARE ON
                        let current_path = paths.split("/"); // SPLIT CURRENT PATH INTO ARRAY OF KEYS
                        let value_exists = _.has(builder, [...current_path, builder_path_label]); // CHECK IF VALUE IS SET FOR CURRENT INPUT
                        let current_value = _.get(builder, [...current_path, builder_path_label]); // GET THAT VALUE
                        let input_type = block?.type ? input_mappings[block.type] : "text"; // GET THE VALUE ACCEPTED FOR THE INPUT
                        let required = block?.nullable ? block?.nullable : false; // GET IF ITS REQUIRED OR NOT
                        let inputValue = current_value ? current_value : ""; // SAFELY GET THE INPUT VALUE                        
                        let pathName = [...current_path, builder_path_label].join("'")
                        // console.log("rendering.input.content", { block, current_path, value_exists, current_value, input_type, required, inputValue });

                        return (
                            <div key={key} className='flex flex-row gap-2 mb-2 justify-between items-center'>
                                <p className='text-black flex flex-row items-center'>
                                    {block.name}
                                    <span className='ml-2 text-xs font-normal text-gray-400'>{block.type}</span>
                                    <span className='text-xs font-normal text-gray-400'>{required ? " *" : ""}</span>
                                </p>
                                <TextInput
                                    id={pathName}
                                    type={input_type}
                                    className='w-[30%]'
                                    placeholder={`${key}`}
                                    required={required}
                                    defaultValue={inputValue}
                                    ref={el => {

                                        if (el) {
                                            el.addEventListener('keyup', (e) => {
                                                let path = e.target.id.split("'");
                                                let value = e.target.value;

                                                console.log("input.e", { path, e });
                                                console.log("input.value.change", value);

                                                let local = builder;
                                                _.set(local, path, value);
                                                setBuilder(local);

                                                console.log("builder", { local });

                                                e.target.focus();
                                                RenderCodeArea();
                                            });
                                        }

                                        return setRefs(refs.set(pathName, el))
                                    }}
                                />
                            </div>
                        )
                    })
                    }
                </div>
            )
        }

        return (<div><p>I visited here</p></div>)
    }

    /**
     * This function recursively creates the form UI & maps in the best way possible, the form input to it's state value
     * 
     * @returns {number} The api request body form UI component with conditionally recusive children
     */
    const BodySection = (builder) => {
        if (page) {
            let body_keys = _.keys(page?.content?.api?.requestBody?.content);
            let has_body = body_keys?.length > 0; // READS THE DATA PER OPEN API-SPEC FORMAT https://spec.openapis.org/oas/v3.1.0#operationObject:~:text=components/parameters.-,requestBody,-Request%20Body%20Object
            if (has_body) {
                let body_schema_selected = body_keys[0];
                let body = page?.content?.api?.requestBody?.content[body_schema_selected]; // GETS THE FIRST BODY SCHEMA TYPE (TODO: ALLOW EDITING/SELECTION)
                let fields = body?.schema.properties;

                console.log("body", { has_body, body, fields, builder })
                // console.log("rendering.body.section")

                return (<div>
                    <h2 className='text-lg font-medium mt-5'>
                        Request Body
                    </h2>
                    <Formations fields={fields} paths={"body"} />
                </div>)
            }
        }
    }

    // RETURNS FORMS FOR 3 TYPES OF REQUEST PARAMETERS (HEADER, QUERY, PATH & COOKIE PARAMS)
    const ParametersSection = (builder) => {
        // GO OVER EACH PARAMETER
        // GROUP THEM BY THEIR PARAMETER TYPE
        // FOR EACH CATEGORY
        // CREATE ITS SECTION OF THE VIEW BLOCK
        // RENDER IT IN THE VIEW
        if (page) {
            let parameters = page?.content?.api?.parameters; // USES PARAMS DATA PER OPEN-API-SPEC FORMAT https://spec.openapis.org/oas/v3.1.0#operationObject:~:text=programming%20naming%20conventions.-,parameters,-%5BParameter%20Object
            let input_mappings = { string: "text", integer: "number" };
            console.log("parameters", { parameters, builder })
            if (parameters) {
                let header_params = parameters.filter(param => param["in"] == "header");
                let query_params = parameters.filter(param => param["in"] == "query");
                let path_params = parameters.filter(param => param["in"] == "path");
                let cookie_params = parameters.filter(param => param["in"] == "cookie");

                let grouped = [
                    { label: "Header", child: header_params },
                    { label: "Query", child: query_params },
                    { label: "Path", child: path_params },
                    { label: "Cookie", child: cookie_params },
                ];

                return (<div className='mb-4'>
                    {grouped.map((block, block_index) => {
                        if (block.child.length > 0) {
                            let builder_path_label = block.label.toLowerCase();
                            return (
                                <div key={builder_path_label}>
                                    <h2 className='text-lg font-medium mt-5'>
                                        {block.label} Params
                                    </h2>

                                    {block.child.map((param, param_index) => {
                                        let value_exists = _.has(builder, ["parameters", builder_path_label, param.name]);
                                        let current_value = _.get(builder, ["parameters", builder_path_label, param.name]);
                                        let input_type = param?.schema ? input_mappings[param.schema.type] : "text";
                                        let required = param?.required ? param?.required : false;
                                        let pathName = ["parameters", builder_path_label, `${param.name}`].join("'")
                                        let inputValue = current_value ? current_value : ""; // SAFELY GET THE INPUT VALUE                        
                                        // console.log("parameters.group.child.loop", { current_value, inputValue, pathName });

                                        return (
                                            <div key={pathName} className='flex flex-row gap-2 mb-2 justify-between items-center'>
                                                <p>{param.name}
                                                    <span className='ml-2 text-xs font-normal text-gray-400'>{param.schema.type}</span>
                                                    <span className='text-xs font-normal text-gray-400'>{required ? " *" : ""}</span>
                                                </p>
                                                <TextInput
                                                    id={pathName}
                                                    type={input_type}
                                                    className='w-[30%]'
                                                    placeholder={param.name}
                                                    required={required}
                                                    defaultValue={inputValue}
                                                    ref={el => {

                                                        if (el) {
                                                            el.addEventListener('keyup', (e) => {
                                                                let path = e.target.id.split("'");
                                                                let value = e.target.value;

                                                                console.log("input.e", { path, e });
                                                                console.log("input.value.change", value);

                                                                let local = builder;
                                                                _.set(local, path, value);
                                                                setBuilder(local);

                                                                console.log("builder", { local });

                                                                e.target.focus();
                                                                RenderCodeArea();
                                                            });
                                                        }

                                                        return setParamRefs(paramRefs.set(pathName, el))
                                                    }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div >
                            )
                        }
                    })}
                </div >);
            }
        }
    }

    const APIRequestDataForm = useMemo(() => {
        setBuilder({});
        console.log("api.form.refreshed", { refs, paramRefs });
        // TODO: CHOOSE SERVER BASE ENDPOINT

        // EMPTY ALL INPUTS AND PARAMETER FIELDS
        if (paramRefs.size > 0) {
            paramRefs.forEach((element, key) => {
                if (element) {
                    element.value = "";
                    // let el = paramRefs.get(key);
                    // el?.value = "";
                }
                console.log(`Key: ${key}, element:`, { element });
            });
        }


        if (refs.size > 0) {
            refs.forEach((element, key) => {
                if (element) {
                    element.value = "";
                    // let el = refs.get(key);
                    // el?.value = "";
                }
                console.log(`Key: ${key}, element:`, { element });
            });
        }

        return (
            <div className='border shadow-sm rounded-lg p-5'>
                <p className='mb-2'>Build Requests</p>

                <h2 className='text-2xl font-bold text-gray-900'>
                    {page?.title}
                </h2>
                <p className='flex items-center gap-4'>{Indicators(page)} Endpoint:  {page?.content?.api?.endpoint}</p>
                {ParametersSection({})}
                {BodySection({})}
            </div>
        )
    }, [page]);

    const APIRequestRequester = () => {
        return (
            <div className='border shadow-sm rounded-lg p-3'>
                <p className='mb-2'>Test/Send Requests</p>

                <div>
                    <h2 className='text-2xl font-bold text-gray-900'>
                        Languages/Environments
                    </h2>
                    <div className='flex gap-2 content-between'>
                        {environments.map((language, index) => {
                            return (
                                <div key={language?.name}
                                    className={`border mt-2 mb-2 p-2 text-center cursor-pointer w-1/3 ${selected == index ? "border-gray-400" : ""}`}
                                    onClick={() => {
                                        setSelected(index);
                                        RenderCodeArea(index);
                                    }}>
                                    <Image src={language.logo} alt="me" width="30" height="30" className='mx-auto h-[20px] w-[20px]' />
                                    <p className='mt-2 text-xs'>{language.name}</p>
                                </div>
                            )
                        })}
                    </div>


                    <div className='flex justify-between'>
                        <p className='text-sm font-normal mt-3 mb-2 text-gray-900'>
                            Request
                        </p>
                        <p className='text-sm font-normal mt-3 mb-2 text-gray-900 cursor-pointer' onClick={() => {
                            copyToClipboard(code, {
                                debug: true,
                                message: 'Press #{key} to copy',
                            });
                            toast("Request code copied")
                        }}>
                            <DocumentCopy size="16" color="#4f4f4f" />
                        </p>
                    </div>
                    <div className='border p-2'>
                        <Editor
                            value={code}
                            onValueChange={code => setCode(code)}
                            highlight={code => highlight(code != undefined ? code : "", languages.js)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 10,
                                maxHeight: "220px",
                                overflowY: "scroll"
                            }}
                        />

                    </div>

                    <Button size="xs" color="gray"
                        className='rounded-none !border-gray-300 w-[100%] mt-2 pt-2 pb-2 !outline-none focus:ring-transparent' onClick={() => {
                            SendRequest();
                        }}>
                        <span className="pr-3">
                            Send Request
                        </span>
                        {
                            processing &&
                            <Spinner size='sm' aria-label="Spinner button example" />
                        }
                    </Button>

                </div>

            </div>
        )
    }

    const APIRequestResponseViewer = () => {
        let responses = _.keys(page?.content?.api?.responses).map(key => {
            return ({
                code: key,
                data: page?.content?.api?.responses[key]
            })
        });
        return (
            <div className='border shadow-sm rounded-lg p-3 mt-3'>
                <div className='flex justify-between items-center'>
                    <p className='mb-2'>Request Response</p>

                    <div className='flex justify-between items-center'>

                        <p className={`text-sm cursor-pointer ${viewer == 'live' ? "font-bold text-gray-800" : "font-normal text-gray-900 "}`} onClick={() => {
                            setViewer("live");
                        }}>
                            Live
                        </p>

                        <p className={`text-sm cursor-pointer ml-3 ${viewer == 'demo' ? "font-bold text-gray-800" : "font-normal text-gray-900 "}`} onClick={() => {
                            setViewer("demo");
                        }}>
                            Demo
                        </p>

                    </div>
                </div>

                <div className='border p-2'>
                    {viewer == 'live' ?
                        <div className=''>
                            {/* <Editor
                            value={response}
                            highlight={response => highlight(response != undefined ? response : "", languages.js)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 10,
                                maxHeight: "220px",
                                overflowY: "scroll"
                            }}
                        /> */}
                        </div>
                        :
                        <div className=''>
                            <div className='flex justify-start items-center'>
                                {responses.map((response, index) => {
                                    if (response.data.content) {
                                        return (
                                            <div key={index} className={`rounded-none border w-auto mr-2 pr-2 pl-2 cursor-pointer ${demoIndex == index ? 'bg-blue-700 text-white border-blue-700' : ''}`}
                                                onClick={() => {
                                                    setDemoIndex(index);

                                                    // let results = "";
                                                    // _.keys(response.data?.content).map((contentType, index) => {
                                                    //     let schema = response.data.content[contentType].schema;
                                                    //     results += `//${contentType} \n ${json5.stringify(generateFakeData(schema), undefined, 4)} \n \n`;
                                                    // })
                                                    // setDemo(results);
                                                }}>
                                                <p className='text-xs w-auto'>{response.code}</p>
                                            </div>
                                        )
                                    }
                                })
                                }
                            </div>

                            <Editor
                                value={demo}
                                highlight={demo => highlight(demo != undefined ? demo : "", languages.js)}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 10,
                                    maxHeight: "220px",
                                    overflowY: "scroll"
                                }}
                            />
                        </div>
                    }
                </div>

            </div>
        )
    }

    return (
        <div className="flex flex-row justify-between">

            <div className="p-4 rounded-lg dark:border-gray-700 w-[60%]">
                {APIRequestDataForm}
            </div>

            <div className="p-4 rounded-lg dark:border-gray-700 w-[40%]">
                <APIRequestRequester />
                <APIRequestResponseViewer />
            </div>

        </div>
    )
}
