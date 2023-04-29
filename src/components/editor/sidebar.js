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
    const [processing, setProcessing] = useState(false);

    let defaultRoutes = [
        { icon: <Box size="16" color="#111827" />, title: "Product", id: 'product' },
        { icon: <Code1 size="16" color="#111827" />, title: "API Reference", id: 'api' },
        { icon: <Setting3 size="16" color="#111827" />, title: "Configuration", id: 'configuration' },
    ];

    function HandleAddPage(position) {
        let page = {
            type: 'product',
            position: position,
            title: position == 'chapter' ? "Added Chapter Page" : "Added Page",
            content: { editor: AppState.DEFAULT_INITIAL_PAGE_BLOCKS_DATA, mdx: "" },
            children: []
        };
        console.log(page);

        // GET ALL THE LATEST CONTENT
        AppState.ContentAPIHandler('POST', page).then(response => {
            AppState.setContent([...AppState.content, response.data])
            console.log('response', response.data);
        }).catch(error => {
            console.log('error', error);
            alert('Error creating the page')
        })
    }

    const Directory = ({ page }) => {

        // KNOW IF THIS PAGE IS OPENED OR NOT
        let pagination = JSON.parse(localStorage.getItem('pagination'));
        let mapping = pagination[page.id];
        let pageOpened = mapping !== undefined ? mapping : false;
        if (page.id == 'book') {
            pageOpened = true;
        }

        const [isExpanded, toggleExpanded] = useState(pageOpened);
        const pages = [...AppState.content];

        // console.log("page", page);
        // console.warn("pagination", pagination);
        // console.warn("mapping", mapping);

        if (page.children.length > 0) {
            return (
                <div className={page.id == 'book' ? '' : 'folder'}>

                    <div className='flex flex-row w-100'>
                        {/* // rendering the drop or right icons */}
                        {page.id != 'book' && <h2 className="folder-title text-sm font-medium flex items-center p-1 border mr-2"
                            onClick={() => {
                                let change = !isExpanded;
                                toggleExpanded(change);

                                // cold store
                                let toStore = { ...JSON.parse(localStorage.getItem('pagination')) };
                                toStore[page.id] = change;
                                localStorage.setItem('pagination', JSON.stringify(toStore));
                            }}>
                            {isExpanded == true ? <ArrowDown2 size="16" color="#111827" /> : <ArrowRight2 size="16" color="#111827" />}
                        </h2>}

                        {/* rendering the textual part of it */}
                        <h2
                            className={`folder-title flex flex-1 justify-between items-center w-100 ${page.id === 'book' ? 'text-md font-normal' : 'text-sm font-medium'}`}
                            onClick={() => {
                                router.push(`/editor/product/?page=${page.id}`, undefined, { shallow: true })
                            }}>
                            {page.title}
                            {page.id === 'book' && <Button isProcessing={processing} size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>}
                        </h2>
                    </div>

                    <br />
                    {isExpanded == true && page.children.map((id) => < Directory key={id} page={pages.find(paged => paged.id === id)} />)}
                </div>
            )
        }

        return (
            <>
                <h3 className="file-name text-sm cursor-pointer flex justify-between items-center"
                    onClick={() => {
                        router.push(`/editor/product/?page=${page.id}`, undefined, { shallow: true })
                    }}>
                    {page.title}
                    {page.id === 'book' && <Button isProcessing={processing} size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>}
                </h3>
                <br />
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

        // GET ALL THE FIRST PARENTS UNDER THIS PAGE
        let productChapters = AppState.content.filter(child => child?.type === 'product' && child?.position === 'chapter')
        let pages = { id: "book", title: "Product Documentation", content: "", children: productChapters.map(main => main.id) };

        // CHECK IF WE HAVE A NAVIGATION STYLING DATA ALREADY
        if (localStorage.getItem('pagination') == null) {
            localStorage.setItem('pagination', JSON.stringify({}));
        }

        // IF YES, SET FOR EACH PARENT, THAT THEY SHOULD BE OPENED
        let toStore = {};
        productChapters.map(child => { if (child.position.includes('chapter')) { toStore[child.id] = true } });
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
                    <Directory page={pages} />
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
