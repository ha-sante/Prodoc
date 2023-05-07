import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2, Add, More2, More, HambergerMenu, Menu, Fatrows, CloudConnection } from 'iconsax-react';

import { AppStateContext } from '../../context/state';
import toast, { Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const _ = require('lodash');

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

export default function BuilderEditor() {
    const AppState = useContext(AppStateContext);
    const router = useRouter();
    const [environments, setEnvironments] = useState([
        { logo: "/editor/curl.svg", name: "cURL" },
        { logo: "/editor/javascript.svg", name: "JavaScript" },
        { logo: "/editor/python.svg", name: "Python" },
        { logo: "/editor/node.svg", name: "Node.js" },
        { logo: "/editor/go.svg", name: "Golang" },
        { logo: "/editor/go.svg", name: "Java" },
    ]);
    const [selected, setSelected] = useState(0);
    const [code, setCode] = useState(
        `function add(a, b) { return a + b; }`
    );


    useEffect(() => {
        let environment = environments[selected];
        let template = ``;

        switch (environment.name.toLowerCase()) {
            case "curl":
                template = ``;
                setCode(code);
                break;
            case "javascript":
                template = ``;
                setCode(code);
                break;
            case "curl":
                template = ``;
                setCode(code);
                break;
        }
    }, [selected]);

    const Indicators = (page) => {
        // IF THE VALUE IS API
        // RETURN A INDICATOR OF 
        if (page.type == "api" && page.content.api.type) {
            let colors = { get: "success", post: "info", put: "indigo", delete: "failure", patch: "warning" }
            return <Badge color={colors[page.content.api.type]} className='inline rounded-full'>{page.content.api.type}</Badge>
        }
    }

    const Formations = ({ property, paths }) => {
        let input_mappings = { string: "text", integer: "number", object: "text" };
        //console.log("Formations", { paths, property });

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

                        if (_.isPlainObject(block.properties)) {
                            let new_paths = paths + `/${block.name}`;
                            //console.log("block.is.of.type.object", { new_paths, block })
                            return (
                                <div className='mb-2'>
                                    <p className='text-black flex flex-row items-center'>{block.name}
                                        <span className='ml-2 text-xs font-normal text-gray-400'>{block.type}</span>
                                    </p>
                                    <div className='ml-4 mt-2'>
                                        <Formations property={block} paths={new_paths} />
                                    </div>
                                </div>
                            )
                        }

                        let builder_path_label = key;
                        let current_path = paths.split("/")
                        let value_exists = _.has(AppState.builder, [...current_path, builder_path_label, block.name]);
                        let current_value = _.get(AppState.builder, [...current_path, builder_path_label, block.name]);
                        let input_type = block?.type ? input_mappings[block.type] : "text";
                        let required = block?.nullable ? block?.nullable : false;
                        //console.log("block.typed", { builder_path_label, current_path, value_exists, current_value, input_type })
                        return (
                            <div className='flex flex-row gap-2 mb-2 justify-between items-center'>
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
                                    value={current_value}
                                    onChange={(e) => {
                                        let value = input_type == "number" ? _.toNumber(e.target.value) : e.target.value;
                                        let local = AppState.builder;
                                        _.set(local, [...current_path, builder_path_label], value);
                                        AppState.setBuilder(local);
                                        //console.log("block.input.changed", { value, local, current_value, builder: AppState.builder })
                                    }}
                                />
                            </div>
                        )
                    })
                    }
                </div>
            )
        }

        return (<div><p>Hello Rolling</p></div>)
    }

    const BodySection = () => {
        // GET THE FIRST ELEMENT OF THE BODY
        // GET ITS SCHEMA
        // - GET THE SCHEMAS PROPERTIES

        // GO OVER EACH AND CREATE THE FORM
        // - PER EACH CHILD, CHECK IF THERE'S AN OBJECT
        // - IF THERE'S AN OBJECT, CALL RECURSIVE FUNCTION

        // RECURSIVELY RENDER THE CHILD'S LIST
        let page = AppState.page;
        if (page) {
            let has_body = AppState?.page?.content?.api?.requestBody?.length > 0;
            if (has_body) {
                let body = page?.content?.api?.requestBody[0]; // is an object of element name and content\
                let first_el_key = Object.keys(body)[0];
                let property = _.get(body, first_el_key)?.schema;
                //console.log("body", { has_body, body, property })

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
        let page = AppState.page;
        if (AppState.page) {
            let parameters = AppState?.page?.content?.api?.parameters;
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
                                            block.child.map(param => {
                                                let value_exists = _.has(AppState.builder, ["parameters", builder_path_label, param.name]);
                                                let current_value = _.get(AppState.builder, ["parameters", builder_path_label, param.name]);
                                                let input_type = param?.schema ? input_mappings[param.schema.type] : "text";
                                                let required = param?.required ? param?.required : false;
                                                return (
                                                    <div className='flex flex-row gap-2 mb-2 justify-between items-center'>
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
                                                                let local = AppState.builder;
                                                                _.set(local, ["parameters", builder_path_label, param.name], value);
                                                                AppState.setBuilder(local);
                                                                //console.log("param.input.changed", { value, local, current_value, builder: AppState.builder })
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
                        {AppState.page.title}
                    </h2>
                    <p className='flex items-center gap-4'>{Indicators(AppState.page)} Endpoint:  {AppState.page.content?.api?.endpoint}</p>
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
