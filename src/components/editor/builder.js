import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2, Add, More2, More, HambergerMenu, Menu, Fatrows, CloudConnection } from 'iconsax-react';

import { AppStateContext } from '../../context/state';
import toast, { Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function BuilderEditor() {
    const AppState = useContext(AppStateContext);
    const router = useRouter();


    const parametersSection = () => {
        // GO OVER EACH PARAMETER
        // GROUP THEM BY THEIR PARAMETER TYPE


        // FOR EACH CATEGORY
        // CREATE ITS SECTION OF THE VIEW BLOCK

        // RENDER IT IN THE VIEW
        let page = AppState.page;
        if (AppState.page) {
            let parameters = AppState?.page?.content?.api?.parameters;
            console.log("parameters", { parameters })
            if (parameters) {
                let header_params = parameters.filter(param => param["in"] == "header");
                let query_params = parameters.filter(param => param["in"] == "query");
                let path_params = parameters.filter(param => param["in"] == "path");
                let cookie_params = parameters.filter(param => param["in"] == "cookie");

                return (<div>

                    {
                        header_params.length > 0 &&
                        <div>
                            <h2>Header Params</h2>
                            <div>
                            </div>
                        </div>
                    }

                </div>);
            }
        }
    }


    return (
        <div className="flex flex-row justify-between">
            {/* // builder */}
            {/* api preview */}
            <div className="p-4 rounded-lg dark:border-gray-700 w-[60%]">
                <div className='border shadow-sm rounded-lg p-3'>
                    <p>Builder View</p>

                    {parametersSection()}
                </div>
            </div>

            <div className="p-4 rounded-lg dark:border-gray-700 w-[40%]">
                <div className='border shadow-sm rounded-lg p-3'>
                    <p>Operations View</p>
                </div>
            </div>

        </div>
    )
}
