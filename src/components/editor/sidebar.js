import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2, Add, More2, More, HambergerMenu, Menu, Fatrows } from 'iconsax-react';

import { AppStateContext } from '../../context/state';
import toast, { Toaster } from 'react-hot-toast';

export default function EditorSidebar() {
    const AppState = useContext(AppStateContext);
    const router = useRouter();
    const { slug } = router.query;
    const [route, setRoute] = useState('main');
    const [processing, setProcessing] = useState(false);
    const [opened, setOpened] = useState('');
    const [permission, setPermission] = useState(false);

    let defaultRoutes = [
        { icon: <Box size="16" color="#111827" />, title: "Product", id: 'product' },
        { icon: <Code1 size="16" color="#111827" />, title: "API Reference", id: 'api' },
        { icon: <Setting3 size="16" color="#111827" />, title: "Configuration", id: 'configuration' },
    ];

    function HandleAddPage(position, parent_id) {
        // PAGE IS SOMETHING
        let page = {
            type: 'product',
            position: position,
            title: position == 'chapter' ? "Added Chapter Page" : "Added Child Page",
            content: { editor: AppState.DEFAULT_INITIAL_PAGE_BLOCKS_DATA, mdx: "" },
            children: []
        };
        console.log({ page, parent_id, position });

        // GET ALL THE LATEST CONTENT
        AppState.ContentAPIHandler('POST', page).then(response => {
            console.log('response', response.data);
            toast.success('Child Page created & saved');

            if (parent_id) {
                // AFTER CREATION, OF THE CHILD PAGE
                // ADD IT TO THE PARENTS CHILDREN LIST
                // & UPDATE THE PARENTS DATA
                // OPEN THE PARENTS DROPDOWN
                let parent_page = AppState.content.find((page) => page.id == parent_id);
                parent_page.children.push(response.data.id);

                AppState.ContentAPIHandler('PUT', parent_page).then(response2 => {
                    console.log('response', response2.data);
                    let newContent = [...AppState.content];
                    let parent_page_index = AppState.content.findIndex((page) => page.id == parent_id);
                    newContent[parent_page_index] = response2.data;

                    AppState.setContent([...newContent, response.data])
                    toast.success('Parent Page updated & saved');
                }).catch(error => {
                    console.log('error', error);
                });

            } else {
                AppState.setContent([...AppState.content, response.data])
            }

        }).catch(error => {
            console.log('error', error);
            toast.error('Got an error saving this page!');
        })

    }

    function HandleDeletePage(page) {
        AppState.ContentAPIHandler('DELETE', page).then(response2 => {
            let newContent = AppState.content.filter((block) => block.id !== page.id);
            AppState.setContent([...newContent])
            toast.success('Page deleted');
        }).catch(error => {
            console.log('error', error);
            toast.error('Got an error deleting this page!');
        });
    }

    const Directory = ({ page }) => {

        // KNOW IF THIS PAGE IS OPENED OR NOT
        let pagination = JSON.parse(localStorage.getItem('pagination'));
        let mapping = pagination[page?.id];
        let pageOpened = mapping !== undefined ? mapping : false;
        if (page?.id == 'book') {
            pageOpened = true;
        }

        const [isExpanded, toggleExpanded] = useState(pageOpened);
        const [isShown, setIsShown] = useState(false);
        const pages = [...AppState.content];

        // console.log("page", page);
        // console.warn("pagination", pagination);
        // console.warn("mapping", mapping);
        if (page?.id) {
            if (page?.children.length > 0) {
                return (
                    <div className={`${page.id == 'book' ? '' : ''} ${page.position == 'child' ? 'folder' : ''}`}>
                        <div className={`${page.position === 'child' ? 'folder flex flex-row w-100 justify-between items-center cursor-pointer' : 'flex justify-between items-center cursor-pointer'} border-red-400`}
                            onMouseEnter={() => setIsShown(true)} onMouseLeave={() => setIsShown(false)}>

                            <div className='flex flex-row items-center border-blue-500'>
                                {page.id != 'book' &&
                                    <h2 className="folder-title text-sm font-medium flex items-center p-1 border ml-2"
                                        onClick={() => {
                                            let change = !isExpanded;
                                            toggleExpanded(change);

                                            // cold store
                                            let toStore = { ...JSON.parse(localStorage.getItem('pagination')) };
                                            toStore[page.id] = change;
                                            localStorage.setItem('pagination', JSON.stringify(toStore));
                                        }}>
                                        {isExpanded == true ?
                                            <ArrowDown2 size="16" color="#111827" />
                                            :
                                            <ArrowRight2 size="16" color="#111827" />
                                        }
                                    </h2>
                                }
                                <h3 className={`${page.id == 'book' ? '' : 'file-name font-normal'} text-sm overflow-hidden text-ellipsis flex`}
                                    onClick={() => {
                                        router.push(`/editor/product/?page=${page.id}`, undefined, { shallow: true })
                                    }}>
                                    {page.title}
                                </h3>
                            </div>

                            {page.id === 'book' ?
                                <Button isProcessing={processing} size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>
                                :
                                <div className='flex flex-row w-100 items-center'>
                                    <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                        onClick={() => { console.log("open more options") }}>
                                        <span className='leading-none'><More size={'12px'} /></span>
                                    </div>
                                    <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                        onClick={() => { HandleAddPage("child", page.id) }}>
                                        <span className='leading-none'>+</span>
                                    </div>
                                </div>
                            }

                        </div>

                        <br />
                        {isExpanded == true && page.children.map((id) => < Directory key={id} page={pages.find(paged => paged.id === id)} />)}
                    </div >
                )
            }

            {/* Directory/Page name */ }
            let allowed = page?.id == 'book' || page?.position == 'chapter';
            return (
                <>
                    <div className={`${page.position === 'child' ? 'ml-5' : ''} flex flex-row w-100 justify-between items-center cursor-pointer`}
                        onMouseEnter={() => { setIsShown(true); }} onMouseLeave={() => { setIsShown(false) }}>
                        <div className='flex flex-row w-100 items-center'>
                            {allowed &&
                                <h2 className="folder-title text-sm font-medium flex items-center p-1 border ml-2"
                                    onClick={() => {
                                        let change = !isExpanded;
                                        toggleExpanded(change);

                                        // cold store
                                        let toStore = { ...JSON.parse(localStorage.getItem('pagination')) };
                                        toStore[page.id] = change;
                                        localStorage.setItem('pagination', JSON.stringify(toStore));
                                    }}>
                                    {isExpanded == true ?
                                        <ArrowDown2 size="16" color="#111827" />
                                        :
                                        <ArrowRight2 size="16" color="#111827" />
                                    }
                                </h2>
                            }

                            <h3 className="file-name text-sm overflow-hidden text-ellipsis"
                                onClick={() => {
                                    router.push(`/editor/product/?page=${page.id}`, undefined, { shallow: true })
                                }}>
                                {page.title}
                            </h3>
                        </div>

                        <div className='flex flex-row w-100 items-center'>
                            <Dropdown
                                label={<div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                    onClick={() => { console.log("open more options") }}>
                                    <span className='leading-none' id="dropdownOffsetButton" data-dropdown-toggle="dropdownOffset" data-dropdown-offset-distance="10" data-dropdown-offset-skidding="100" data-dropdown-placement="right">
                                        <More size={'12px'} />
                                    </span>
                                </div>}
                                inline={true}
                                arrowIcon={false}
                                floatingArrow={false}
                                trigger='hover'
                                dismissOnClick={true}>
                                <Dropdown.Item onClick={() => HandleDeletePage(page)}>
                                    Delete
                                </Dropdown.Item>
                            </Dropdown>

                            <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                onClick={() => { HandleAddPage("child", page.id) }}>
                                <span className='leading-none'>+</span>
                            </div>
                        </div>

                    </div>
                    <br />
                </>
            )

        }
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

        console.log("pages.to.be.edited", pages);
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
