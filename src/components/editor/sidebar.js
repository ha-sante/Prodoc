import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2 } from 'iconsax-react';

import { AppStateContext } from '../../context/state';

export default function EditorSidebar() {
    const AppState = useContext(AppStateContext);

    const router = useRouter();
    const { slug } = router.query;

    const [route, setRoute] = useState('main');

    let defaultRoutes = [
        { icon: <Box size="16" color="#111827" />, title: "Product", id: 'product' },
        { icon: <Code1 size="16" color="#111827" />, title: "API Reference", id: 'api' },
        { icon: <Setting3 size="16" color="#111827" />, title: "Configuration", id: 'configuration' },
    ];

    function HandleAddPage(option) {
        // AppState.setProductContent([...AppState.productContent, { id: "", title: "Example Documentation Page", content: "", children: [] }])
    }

    const Directory = ({ files }) => {

        // KNOW IF THIS PAGE IS OPENED OR NOT
        let pagination = JSON.parse(localStorage.getItem('pagination'));
        let mapping = pagination[files.id];
        let pageOpened = mapping !== undefined ? mapping : false;
        if (files.id.includes('doc')) {
            pageOpened = true;
        }

        const [isExpanded, toggleExpanded] = useState(pageOpened);
        const pages = [...AppState.productContent];

        // console.log("files", files);
        // console.warn("pagination", pagination);
        // console.warn("mapping", mapping);

        if (files.children.length > 0) {
            return (
                <div className={files.id.includes('doc') ? '' : 'folder'}>

                    <div className='flex flex-row w-100'>
                        {/* // rendering the drop or right icons */}
                        {!files.id.includes('doc') && <h2 className="folder-title text-sm font-medium flex items-center p-1 border mr-2"
                            onClick={() => {
                                let change = !isExpanded;
                                toggleExpanded(change);

                                // cold store
                                let toStore = { ...JSON.parse(localStorage.getItem('pagination')) };
                                toStore[files.id] = change;
                                localStorage.setItem('pagination', JSON.stringify(toStore));
                            }}>
                            {isExpanded == true ? <ArrowDown2 size="16" color="#111827" /> : <ArrowRight2 size="16" color="#111827" />}
                        </h2>}

                        {/* rendering the textual part of it */}
                        <h2
                            className={`folder-title flex flex-1 justify-between items-center w-100 ${files.id.includes('doc') ? 'text-md font-normal' : 'text-sm font-medium'}`}
                            onClick={() => {
                                router.push(`/editor/product/?page=${files.id}`, undefined, { shallow: true })
                            }}>
                            {files.title}
                            {files.id.includes('doc') && <Button size="xs" className='' onClick={() => { HandleAddPage("parent") }}>+</Button>}
                        </h2>
                    </div>

                    <br />
                    {isExpanded == true && files.children.map((id) => < Directory key={id} files={pages.find(page => page.id === id)} />)}
                </div>
            )
        }

        return (
            <>
                <h3 className="file-name text-sm cursor-pointer" onClick={() => {
                    router.push(`/editor/product/?page=${files.id}`, undefined, { shallow: true })
                }}>{files.title}</h3><br />
            </>
        )
    }

    useEffect(() => {
        if (slug) {
            console.log(slug);
            switch (slug[0]) {
                case 'product':
                    console.log("product section of documentation");
                    setRoute(slug)
                    break;
            }
        } else {
            setRoute('main')
        }
    }, [slug]);

    function MainNavigation() {
        return (
            <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 flex justify-between flex-col">

                <ul className="space-y-2 font-medium">
                    <p className="pl-2 mb-3">Welcome 👋</p>
                    {defaultRoutes.map((route) => {
                        return (
                            <li key={route.id}>
                                <Link href={`/editor/${route.id.toLowerCase()}`} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {route.icon}
                                    <span className="ml-3">{route.title}</span>
                                </Link >
                            </li>
                        )
                    })}
                </ul>

                <ul className="space-y-2 font-medium">
                    <li>
                        <a href="#" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Logout size="16" color="#111827" />
                            <span className="ml-3"> Log out</span>
                        </a>
                    </li>
                </ul>
            </div>
        )
    }

    function SubPageNavigation() {

        let mainPages = AppState.productContent.filter(child => child.id.includes('main'))
        let pages = { id: "doc-product-documentation", title: "Product Documentation", content: "", children: mainPages.map(main => main.id) };

        // checking
        if (localStorage.getItem('pagination') == null) {
            localStorage.setItem('pagination', JSON.stringify({}));
        }

        // rendering
        let toStore = {};
        mainPages.map(child => { if (child.id.includes('main')) { toStore[child.id] = true } });
        try {
            if (Object.keys(JSON.parse(localStorage.getItem('pagination'))).length === 0) {
                localStorage.setItem('pagination', JSON.stringify(toStore));
            }
        } catch (error) {
            console.log("error", error);
        }


        return (
            <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 justify-between">

                <ul className="font-medium mb-4">
                    <li>
                        <Link href="/editor" className="border flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft size="16" color="#111827" />
                            <span className="ml-3"> Back</span>
                        </Link>
                    </li>
                </ul>

                <div className="mt-4 mb-4" id="navigation">
                    <Directory files={pages} />
                </div>
            </div>
        )
    }

    return (
        <aside id="default-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
            {route == 'main' ? MainNavigation() : SubPageNavigation()}
        </aside>
    )
}
