import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2, Add, More2, More, HambergerMenu, Menu, Fatrows, CloudConnection } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom,
    DEFAULT_INITIAL_PAGE_BLOCKS_DATA, DEFAULT_PAGE_DATA
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

export default function BuilderEditor() {
    const [content, setContent] = useAtom(contentAtom);

    const [pagination, setPagination] = useAtom(paginationAtom);
    const [page, setPage] = useAtom(pageAtom);
    const [builder, setBuilder] = useAtom(builderAtom);

    const [configure, setConfigure] = useAtom(configureAtom);
    const [edited, setEdited] = useAtom(editedAtom);
    const [authenticated, setAuthenticated] = useAtom(authenticatedAtom);
    const [permission, setPermission] = useAtom(permissionAtom);
    const [definitions, setDefinitions] = useAtom(definitionsAtom);

    const [code, setCode] = useAtom(codeAtom);
    const [navigation, setNavigation] = useAtom(navigationAtom);


    const router = useRouter();
    const [environments, setEnvironments] = useState([
        { logo: "/editor/curl.svg", name: "cURL", target: "shell" },
        { logo: "/editor/javascript.svg", name: "JavaScript", target: "javascript" },
        { logo: "/editor/python.svg", name: "Python", target: "python" },
        { logo: "/editor/node.svg", name: "Node.js", target: "node" },
        { logo: "/editor/go.svg", name: "Golang", target: "go" },
        { logo: "/editor/ruby.svg", name: "Ruby", target: "ruby" },
    ]);
    const [selected, setSelected] = useState(0);
    const [base, setBase] = useState("");
    // const [code, setCode] = useState(
    //     `function add(a, b) { return a + b; }`
    // );
    // const [builder, setBuilder] = useState({});


    useEffect(() => {
        // SET THE PAGE SERVER ENDPOINT
        if (page) {
            let url = page?.content.api?.configuration?.servers[0].url;
            console.log({ url });
            setBase(url);
            setBuilder({});
        }
    }, [page]);

    const RenderCodeArea = () => {
        let environment = environments[selected];
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
            console.log({ har_format, endpoint })

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
                const output = snippet.convert(environment.target.toLowerCase(), '', options);
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
        RenderCodeArea();
    }, [selected, builder]);

    const Indicators = (page) => {
        // IF THE VALUE IS API
        // RETURN A INDICATOR OF 
        if (page.type == "api" && page.content.api.type) {
            let colors = { get: "success", post: "info", put: "indigo", delete: "failure", patch: "warning" }
            return <Badge color={colors[page.content.api.type]} className='inline rounded-full'>{page.content.api.type}</Badge>
        }
    }

    const TrazeForm = ({ property, paths }) => {
        // FIRST PART OF LOOP = BODY
        if (_.isPlainObject(property.properties)) {
            Object.keys(Object.fromEntries(Object.entries(property.properties).sort())).map((key, index) => {
                let block = { ...property.properties[key], name: key };

                // IF TREE, HAS AN OBJECT AGAIN, LOOP THROUGH THAT
                if (_.isPlainObject(block.properties)) {
                    let new_paths = paths + `/${block.name}`;
                    TrazeForm(block, new_paths);
                }

                // SET NORMAL VALUE PATH
                // VALUE
            })
        }
    }

    const Formations = ({ property, paths }) => {
        let input_mappings = { string: "text", integer: "number", object: "text" };
        //console.log("Formations", { paths, property });

        // SET THE STATE FOR ALL THE OBJECT PROPERTIES NAMES AT THE PATH
        if (_.isPlainObject(property.properties)) {
            // GO OVER EACH MEMBER WITH OBJECT.KEYS
            // RENDER AN INPUT FOR THEM IF THEY ARE OF TYPE STRING
            // IF OBJECT, RETURN THIS FUNCTION
            return (
                <div>
                    {Object.keys(Object.fromEntries(Object.entries(property.properties).sort())).map((key, index) => {
                        let block = property.properties[key];
                        block.name = key; // set property name to its's key
                        //console.warn("block", block);

                        // IF TREE, HAS AN OBJECT AGAIN, LOOP THROUGH THAT
                        if (_.isPlainObject(block.properties)) {
                            let new_paths = paths + `/${block.name}`;
                            //console.log("block.is.of.type.object", { new_paths, block })
                            return (
                                <div className='mb-2' key={key}>
                                    <p className='text-black flex flex-row items-center'>{block.name}
                                        <span className='ml-2 text-xs font-normal text-gray-400'>{block.type}</span>
                                    </p>
                                    <div className='ml-4 mt-2'>
                                        <Formations property={block} paths={new_paths} />
                                    </div>
                                </div>
                            )
                        }

                        // ELSE, RENDER THE FORM BLOCK AS RECIEVED
                        let builder_path_label = key; // GET THE CURRENT END OF THE STICK WE ARE ON
                        let current_path = paths.split("/"); // SPLIT CURRENT PATH INTO ARRAY OF KEYS
                        let value_exists = _.has(builder, [...current_path, builder_path_label, block.name]); // CHECK IF VALUE IS SET FOR CURRENT INPUT
                        let current_value = _.get(builder, [...current_path, builder_path_label, block.name]); // GET THAT VALUE
                        let input_type = block?.type ? input_mappings[block.type] : "text"; // GET THE VALUE ACCEPTED FOR THE INPUT
                        let required = block?.nullable ? block?.nullable : false; // GET IF ITS REQUIRED OR NOT
                        let inputValue = current_value ? current_value : ""; // SAFELY GET THE INPUT VALUE
                        let inputRef = useRef(); // CREATE A HOLD FOR THE INPUT

                        console.log("rendering.input.content", { current_path, value_exists, current_value, input_type, required, inputValue, inputRef });

                        useEffect(() => {
                            // Instruction we give here will render once component gets rendered
                            console.log("current.value.changed", current_value)
                        }, [current_value]);

                        return (
                            <div key={key} className='flex flex-row gap-2 mb-2 justify-between items-center'>
                                <p className='text-black flex flex-row items-center'>{block.name}
                                    <span className='ml-2 text-xs font-normal text-gray-400'>{block.type}</span>
                                    <span className='text-xs font-normal text-gray-400'>{required ? " *" : ""}</span>
                                </p>
                                <TextInput
                                    id={key}
                                    type={input_type}
                                    className='w-[30%]'
                                    placeholder={`${key}`}
                                    required={required}
                                    ref={inputRef}
                                    defaultValue={current_value}
                                    onChange={(e) => {
                                        let value = input_type == "number" ? _.toNumber(e.target.value) : e.target.value;
                                        console.log("input.member.edited", { ref: inputRef, value, builder });
                                        let local = builder;
                                        _.set(local, [...current_path, builder_path_label], value);
                                        console.log("builder.data.update", { local })
                                        e.target.focus();
                                        setBuilder({ ...local });

                                        // // ORIGINAL
                                        // setInputValue({ [key]: value });
                                        // console.log("block.input.changed", { value, local, current_value, builder: builder })
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
    const BodySection = () => {
        let page = page;
        if (page) {
            let has_body = page?.content?.api?.requestBody?.length > 0;
            if (has_body) {
                let body = page?.content?.api?.requestBody[0]; // is an object of element name and content\
                let first_el_key = Object.keys(body)[0];
                let property = _.get(body, first_el_key)?.schema;
                //console.log("body", { has_body, body, property })
                console.log("rendering.body.section")

                return (<div>
                    <h2 className='text-lg font-medium mt-5'>
                        Request Body
                    </h2>
                    <Formations property={property} paths={"body"} />
                </div>)
            }
        }
    }

    const ParametersSection = () => {
        // GO OVER EACH PARAMETER
        // GROUP THEM BY THEIR PARAMETER TYPE
        // FOR EACH CATEGORY
        // CREATE ITS SECTION OF THE VIEW BLOCK
        // RENDER IT IN THE VIEW
        let page = page;
        if (page) {
            let parameters = page?.content?.api?.parameters;
            let input_mappings = { string: "text", integer: "number" };
            //console.log("parameters", { parameters })
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
                    {
                        grouped.map((block, block_index) => {
                            if (block.child.length > 0) {
                                let builder_path_label = block.label.toLowerCase();
                                return (
                                    <div key={block_index}>
                                        <h2 className='text-lg font-medium mt-5'>
                                            {block.label} Params
                                        </h2>

                                        {
                                            block.child.map((param, param_index) => {
                                                let value_exists = _.has(builder, ["parameters", builder_path_label, param.name]);
                                                let current_value = _.get(builder, ["parameters", builder_path_label, param.name]);
                                                let input_type = param?.schema ? input_mappings[param.schema.type] : "text";
                                                let required = param?.required ? param?.required : false;
                                                return (
                                                    <div key={param_index} className='flex flex-row gap-2 mb-2 justify-between items-center'>
                                                        <p>{param.name}
                                                            <span className='ml-2 text-xs font-normal text-gray-400'>{param.schema.type}</span>
                                                            <span className='text-xs font-normal text-gray-400'>{required ? " *" : ""}</span>
                                                        </p>
                                                        <TextInput
                                                            id={param.name}
                                                            type={input_type}
                                                            className='w-[30%]'
                                                            placeholder={param.name}
                                                            required={required}
                                                            value={current_value}
                                                            onChange={(e) => {
                                                                let value = input_type == "number" ? _.toNumber(e.target.value) : e.target.value;
                                                                let local = builder;
                                                                _.set(local, ["parameters", builder_path_label, param.name], value);
                                                                setBuilder(local);
                                                                //console.log("param.input.changed", { value, local, current_value, builder: builder })
                                                            }}
                                                        />
                                                    </div>
                                                )
                                            })
                                        }

                                    </div >
                                )
                            }
                        })
                    }
                </div >);
            }
        }
    }

    const OperationsView = () => {

    }

    return (
        <div className="flex flex-row justify-between">
            {/* // builder */}
            {/* api preview */}
            <div className="p-4 rounded-lg dark:border-gray-700 w-[60%]">
                <div className='border shadow-sm rounded-lg p-5'>
                    <p className='mb-2'>Build Requests</p>

                    <h2 className='text-2xl font-bold text-gray-900'>
                        {page?.title}
                    </h2>
                    <p className='flex items-center gap-4'>{Indicators(page)} Endpoint:  {page?.content?.api?.endpoint}</p>
                    {ParametersSection()}
                    {BodySection()}
                </div>
            </div>

            <div className="p-4 rounded-lg dark:border-gray-700 w-[40%]">
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
                                        onClick={() => { setSelected(index) }}>
                                        <Image src={language.logo} alt="me" width="30" height="30" className='mx-auto h-[20px] w-[20px]' />
                                        <p className='mt-2 text-xs'>{language.name}</p>
                                    </div>
                                )
                            })}
                        </div>

                        <p className='text-sm font-normal mt-3 mb-2 text-gray-900'>
                            Request
                        </p>
                        <div className='border p-2'>
                            <Editor
                                value={code}
                                onValueChange={code => setCode(code)}
                                highlight={code => highlight(code != undefined ? code : "", languages.js)}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 12,
                                }}
                            />
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}
