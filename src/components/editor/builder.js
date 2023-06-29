import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useRouter } from 'next/router'

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

export default function BuilderEditor() {
    const [page, setPage] = useAtom(pageAtom);
    const [builder, setBuilder] = useAtom(builderAtom);

    const router = useRouter();
    const [environments, setEnvironments] = useState([
        { logo: "/editor/curl.svg", name: "cURL", target: "shell", client: '' },
        { logo: "/editor/javascript.svg", name: "JavaScript", target: "javascript", client: "fetch" },
        { logo: "/editor/python.svg", name: "Python", target: "python", client: '' },
        { logo: "/editor/node.svg", name: "Node.js", target: "node", client: '' },
        { logo: "/editor/go.svg", name: "Golang", target: "go", client: '' },
        { logo: "/editor/ruby.svg", name: "Ruby", target: "ruby", client: '' },
    ]);

    // VISUALS
    const [selected, setSelected] = useState(0);
    const [viewer, setViewer] = useState('demo');
    const [demoIndex, setDemoIndex] = useState(0);

    // INPUTS
    const [bodyRefs, setBodyRefs] = useState(new Map());
    const [paramRefs, setParamRefs] = useState(new Map());
    const [otherRefs, setOtherRefs] = useState(new Map());

    // FORMS
    // const [builder, setBuilder] = useState({});

    // HOLDERS
    const [response, setResponse] = useState("// Rendering of your request response");
    const [demo, setDemo] = useState("");
    const [code, setCode] = useState("");
    const [serverURL, setServerURL] = useState('');
    const [servers, setServers] = useAtom(serverAtom);

    // INDICATORS
    const [processing, setProcessing] = useState(false);


    // FUNCTIONS
    const SendRequest = () => {
        // SEND THE REQUEST - WITH PARAMS AND BODY
        // LOAD THE RESPONSE - INTO RESPONSE AS A JSON STRING
        setProcessing(true);
        setViewer("live");
        setResponse("");

        let request = {
            baseURL: serverURL, // SERVER ENDPOINT
            url: page?.content?.api?.endpoint,
            method: page?.content.api.method
        }
        // HANDLE PARAMETERS
        let parameters = builder?.parameters;
        if (parameters) {
            if (parameters?.path) {
                // REPLACE PATH VARIABLES WITH THEIR EQUIVALENT DATA
                _.mapKeys(parameters.path, function (value, key) {
                    let new_endpoint = _.replace(request.url, `{${key}}`, value);
                    if (new_endpoint) {
                        request.url = new_endpoint;
                    }
                });
            }
            if (parameters?.header) {
                request.headers = parameters.header;
            }
            if (parameters?.query) {
                request.params = parameters.query;
            }
        }

        // HANDLE BODY
        if (builder.body) {
            request.data = builder.body;
        }

        logger.log("axios.final.object = ", { request, page });

        // SEND REQUEST TO THE BACKEND
        // STORE THE 
        axios(request).then(response => {
            logger.log("request.response", response);
            // logger.log(response.data);
            // logger.log(response.status);
            // logger.log(response.statusText);
            // logger.log(response.headers);
            // logger.log(response.config);

            setProcessing(false);
        }).catch(error => {
            logger.log("request.error", error);


            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logger.log(error.response.data);
                logger.log(error.response.status);
                logger.log(error.response.headers);

                let message = "";
                if (error.code) {
                    message += `code: ${error.code} \n`
                }
                if (error.message) {
                    message += `message: ${error.code} \n`
                }
                if (error.name) {
                    message += `name: ${error.name} \n`
                }

                // name, code, message
                setResponse(message);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                logger.log(error.request);

                let message = "";
                if (error.code) {
                    message += `code: ${error.code} \n`
                }
                if (error.message) {
                    message += `message: ${error.code} \n`
                }
                if (error.name) {
                    message += `name: ${error.name} \n`
                }

                // name, code, message
                setResponse(message);
                toast.error("Request was not successfully.", { position: "bottom-right" })

            } else {
                // Something happened in setting up the request that triggered an Error
                logger.log('Error', error.message);

                let message = "";
                if (error.code) {
                    message += `code: ${error.code} \n`
                }
                if (error.message) {
                    message += `message: ${error.code} \n`
                }
                if (error.name) {
                    message += `name: ${error.name} \n`
                }

                // name, code, message
                setResponse(message);
                toast.error("Something went wrong with the request.", { position: "bottom-right" })
            }
            logger.log(error.config);

            setProcessing(false);
        })
    }

    const RenderCodeArea = (index) => {
        let environment = environments[index !== undefined ? index : selected];
        let template = ``;
        if (page) {
            // GET FORM DATA
            let { body, parameters } = Object(builder);
            let { header, path, query } = Object(parameters);
            let base = serverURL ? serverURL : page?.content?.api?.configuration?.servers[0]?.url;
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
            // //logger.log({ har_format, endpoint })

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

            //logger.log("render.requester.code.called.with", { environment, builder, har_format, snippet })

            try {
                const output = snippet.convert(environment.target.toLowerCase(), environment.client, options);
                //logger.log(output);
                if (output) {
                    setCode(output);
                }
            } catch (error) {
                //logger.log("error.generating.code.example", { error });
                toast.error("Hit a severe error whiles turning this form content into a code example, from the api spec - debug or contact support");
            }

        }
    }

    const ResetBuilderState = () => {
        //RESET
        setSelected(0);
        setViewer('demo');
        setDemoIndex(0);

        // RESET
        setBuilder({});

        // RESET
        setResponse("");
        setDemo("");
        setCode("");
        setProcessing(false);

        // RESET
        setBodyRefs(new Map());
        setParamRefs(new Map());

        //logger.log("api.form.refreshed", { bodyRefs, paramRefs });
        // TODO: CHOOSE SERVER BASE ENDPOINT
        // EMPTY ALL INPUTS AND PARAMETER FIELDS
        if (paramRefs.size > 0) {
            paramRefs.forEach((element, key) => {
                if (element) {
                    element.value = "";
                }
                // logger.log(`Key: ${key}, element:`, { element });
            });
        }
        if (bodyRefs.size > 0) {
            bodyRefs.forEach((element, key) => {
                if (element) {
                    element.value = "";
                }
                // logger.log(`Key: ${key}, element:`, { element });
            });
        }


        // HANDLE PAGE SERVERS - BOTH PARENT AND THE CHILD'S COMBINED (PER OPEN API SPEC) - https://spec.openapis.org/oas/v3.1.0#pathsObject
        let collection = [];
        if (page?.content?.api?.servers) {
            collection = [...page?.content?.api?.servers, ...collection];
        }
        if (page?.content?.api?.configuration?.servers) {
            collection = [...collection, ...page?.content?.api?.configuration?.servers];
        }
        if (collection) {
            setServers(collection);
            setServerURL(collection[0].url);
        }

        // RENDER THE NEW DATA
        RenderCodeArea(0);
    }

    const RenderRequestResponseDemo = () => {
        let responses = _.keys(page?.content?.api?.responses).map(key => {
            return ({
                code: key,
                data: page?.content?.api?.responses[key]
            })
        });
        //logger.log("response", responses);

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
                    // //logger.log("schema.loop", { property, type });
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
                        // //logger.log("fake_array_data", fake_array_data);
                        data[key] = [fake_array_data];
                    } else if (type === 'object') {
                        let results = generateFakeData(property);
                        // //logger.log("fake_object_data.results", results);
                        data[key] = { ...results };
                    } else {
                        // //logger.log("property.type.not.mapped", { schema, type, property });
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
    }

    // EXECUTIONS
    useEffect(() => {
        ResetBuilderState();
    }, [page]);

    useEffect(() => {
        RenderCodeArea(selected);
    }, [serverURL]);

    useEffect(() => {
        RenderCodeArea(selected);
    }, [builder]);

    useEffect(() => {
        RenderRequestResponseDemo();
    }, [page, demoIndex]);


    // RETURNS BODY FORM
    const BodySection = () => {
        const Formations = ({ fields, paths }) => {
            let input_mappings = { string: "text", integer: "number", object: "text" };
            // //logger.log("Formations", { paths, fields });

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
                            ////logger.warn("block", block);

                            // IF TREE, HAS AN OBJECT AGAIN, LOOP THROUGH THAT
                            if (_.isPlainObject(block?.properties)) {
                                let new_paths = paths + `/${block.name}`;
                                ////logger.log("block.is.of.type.object", { new_paths, block })
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
                            let block_type = block?.type; // GET THE VALUE ACCEPTED FOR THE INPUT
                            let required = block?.nullable ? block?.nullable : false; // GET IF ITS REQUIRED OR NOT
                            let inputValue = current_value ? current_value : ""; // SAFELY GET THE INPUT VALUE                        
                            let pathName = [...current_path, builder_path_label].join("'")
                            // //logger.log("rendering.input.content", { block, current_path, value_exists, current_value, input_type, required, inputValue });

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
                                            // logger.log("body.input.element", { el });
                                            if (el) {
                                                el.addEventListener('keyup', (e) => {
                                                    let path = e.target.id.split("'");
                                                    let value = e.target.value;

                                                    // logger.log("input.value.changed.before.builder", builder);
                                                    let local = builder;
                                                    let update = _.set(local, path, value);
                                                    setBuilder({ ...update });
                                                    // logger.log("input.value.changed.after.builder", builder);

                                                    // TODO: Handle input values of a different type from text
                                                    e.target.focus();
                                                });

                                                return setBodyRefs(bodyRefs.set(pathName, el))
                                            }

                                            return null
                                        }}
                                    />
                                </div>
                            )
                        })
                        }
                    </div>
                )
            }

            return (<div><p>Something happened, the form rendering reached this point. (It's not supposed to - debug)</p></div>)
        }

        if (page) {
            let body_keys = _.keys(page?.content?.api?.requestBody?.content);
            let has_body = body_keys?.length > 0; // READS THE DATA PER OPEN API-SPEC FORMAT https://spec.openapis.org/oas/v3.1.0#operationObject:~:text=components/parameters.-,requestBody,-Request%20Body%20Object
            if (has_body) {
                let body_schema_selected = body_keys[0];
                let body = page?.content?.api?.requestBody?.content[body_schema_selected]; // GETS THE FIRST BODY SCHEMA TYPE (TODO: ALLOW EDITING/SELECTION)
                let fields = body?.schema.properties;

                //logger.log("body", { has_body, body, fields, builder })
                // //logger.log("rendering.body.section")

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
    const ParametersSection = () => {
        // GO OVER EACH PARAMETER
        // GROUP THEM BY THEIR PARAMETER TYPE
        // FOR EACH CATEGORY
        // CREATE ITS SECTION OF THE VIEW BLOCK
        // RENDER IT IN THE VIEW
        if (page) {
            let parameters = page?.content?.api?.parameters; // USES PARAMS DATA PER OPEN-API-SPEC FORMAT https://spec.openapis.org/oas/v3.1.0#operationObject:~:text=programming%20naming%20conventions.-,parameters,-%5BParameter%20Object
            let input_mappings = { string: "text", integer: "number" };
            //logger.log("parameters", { parameters, builder })
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
                                        // //logger.log("parameters.group.child.loop", { current_value, inputValue, pathName });

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

                                                                // logger.log("input.value.changed.before.builder", builder);
                                                                let local = builder;
                                                                let update = _.set(local, path, value);
                                                                setBuilder({ ...update });
                                                                // logger.log("input.value.changed.after.builder", builder);

                                                                e.target.focus();
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
        const Indicators = (page) => {
            // IF THE VALUE IS API
            // RETURN A INDICATOR OF 
            if (page.type == "api" && page.content.api?.type) {
                let colors = { get: "success", post: "info", put: "indigo", delete: "failure", patch: "warning" }
                return <Badge color={colors[page.content.api?.type]} className='inline rounded-full'>{page.content.api?.type}</Badge>
            }
        }

        return (
            <div className='border shadow-sm rounded-lg p-5'>
                <p className='mb-2'>Build Requests</p>

                <h2 className='text-2xl font-bold text-gray-900'>
                    {page?.title}
                </h2>
                <div className='flex items-center gap-2 font-normal text-sm mb-2 mt-2'>
                    {Indicators(page)}

                    <div className='flex items-center gap-1'>
                        {servers?.length > 1 &&
                            <Dropdown inline label={<Setting2 size={14} />} arrowIcon={false} className='border mr-0'>
                                {servers.map((server, index) => {
                                    if (server.description) {
                                        <Tooltip key={index} content={server.description} placement="right">
                                            <Dropdown.Item onClick={() => setServerURL(server.url)}>
                                                {server.url}
                                            </Dropdown.Item>
                                        </Tooltip>
                                    }

                                    return (
                                        <Dropdown.Item key={index} onClick={() => setServerURL(server.url)}>
                                            {server.url}
                                        </Dropdown.Item>
                                    )
                                })}
                            </Dropdown>}
                        <p>{serverURL}{page?.content?.api?.endpoint}</p>
                    </div>

                </div>

                <ParametersSection />
                <BodySection />
            </div>
        )
    }, [page, serverURL, servers]);


    // READS - https://spec.openapis.org/oas/v3.1.0#operationObject:~:text=is%20false.-,security,-%5BSecurity%20Requirement
    const APIRequestRequester = () => {
        //logger.log("api.requestor.view.refreshed", { builder, code })

        const RequestAuthSection = () => {
            // GET THE SECURITY SCHEMES ON THIS PAGE ONLY
            let page_api_security_requirements = [...page?.content?.api?.security];

            // IF IT'S UNDEFINED, USE THE PARENT SECURITY VERSION
            if (_.isEmpty(page_api_security_requirements)) {
                page_api_security_requirements = page?.content?.api?.configuration?.security;
            }

            // GET THE ACTUAL SCHEMES FROM THE API CONFIGURATION
            let page_api_security_scheme_objects = [];
            let security_optional_indicated = false;
            page_api_security_requirements.map((item, index) => {
                // ITEM = OBJECT OF SECURITY SCHEME
                if (_.isEmpty(item) == true) {
                    // - Per means, security is optional
                    security_optional_indicated = true;
                } else {
                    // GET SCHEMES FOR USE IN CREATING THE FORM    
                    _.keys(item).map((key) => {
                        let scheme = page?.content?.api?.configuration?.components?.securitySchemes[key];
                        let item_value = item[key];
                        scheme["configuration"] = item_value;
                        page_api_security_scheme_objects.push(scheme);
                    })
                }
            })

            // SUPPORT AUTH HEADER METHODS
            // TODO: Add more authorization methods
            let supported = ["apiKey", "http", "oauth2"];

            logger.log("api.authorization.section", { page_api_security_requirements, page_api_security_scheme_objects })
            return (
                <div>
                    {page_api_security_scheme_objects.map((scheme, index) => {

                        // PAGE CHILD SECURITY https://spec.openapis.org/oas/v3.1.0#operationObject:~:text=is%20false.-,security,-%5BSecurity%20Requirement
                        // - if it's not present, use the parent security.
                        // - if it's [{}] : Security is optional
                        // - if it's [] : Scurity is not needed

                        // IMPORTANT YET POTENTIALLY OPTIONAL KEYS = type, description, name, in, scheme, bearerFormat, flows, openIdConnectUrl

                        logger.log("scheme.item", scheme);
                        return (
                            <div key={index} className='mt-3 mb-3'>

                                <div className='flex justify-between items-center'>
                                    <p className='text-sm font-normal  text-gray-900'>
                                        Authorization
                                    </p>
                                    <p className='font-medium text-xs text-gray-900'>
                                        {scheme?.type.toUpperCase()}
                                    </p>
                                </div>


                                {supported.includes(scheme?.type) ?
                                    <div>
                                        <p className='text-xs'>{scheme?.type} is supported</p>
                                    </div>
                                    :
                                    <div>
                                        <p className='text-xs font-bold text-red-500'>{scheme?.type} authorization methods is not currently built into this UI. Please resort to using your local dev environment to try this api out.</p>
                                    </div>
                                }

                                {/* <TextInput
                                    id={pathName}
                                    type={input_type}
                                    className='w-[30%]'
                                    placeholder={`${key}`}
                                    required={required}
                                    defaultValue={inputValue}
                                    ref={el => {
                                        // logger.log("body.input.element", { el });
                                        if (el) {
                                            el.addEventListener('keyup', (e) => {
                                                let path = e.target.id.split("'");
                                                let value = e.target.value;

                                                // logger.log("input.value.changed.before.builder", builder);
                                                // let local = builder;
                                                // let update = _.set(local, path, value);
                                                // setBuilder({ ...update });
                                                // logger.log("input.value.changed.after.builder", builder);


                                                e.target.focus();
                                            });

                                            return setBodyRefs(bodyRefs.set(pathName, el))
                                        }

                                        return null
                                    }}
                                /> */}

                            </div>
                        )
                    })}
                </div>
            );
        }



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

                    {page?.content?.api?.security && <RequestAuthSection />}

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
                        {processing && <Spinner size='sm' aria-label="Spinner button example" />}
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

                        {response != '' && <p className={`text-sm cursor-pointer ${viewer == 'live' ? "font-bold text-gray-800" : "font-normal text-gray-900 "}`} onClick={() => {
                            setViewer("live");
                        }}>
                            Live
                        </p>}

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
                            {processing && <p className='text-xs'>Request in process...</p>}

                            <Editor
                                value={response}
                                highlight={response => highlight(response != undefined ? response : "", languages.js)}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 10,
                                    maxHeight: "220px",
                                    overflowY: "scroll"
                                }}
                            />
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
                                                }}>
                                                <p className='text-xs w-auto'>{response.code}</p>
                                            </div>
                                        )
                                    }
                                })}
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
