import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, memo } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2, Add, More2, More, HambergerMenu, Menu, Fatrows, CloudConnection } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom,
    DEFAULT_INITIAL_PAGE_BLOCKS_DATA, DEFAULT_PAGE_DATA, ContentAPIHandler
} from '../../context/state';
import { useStore, useAtom } from "jotai";

import toast, { Toaster } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const StrictModeDroppable = ({ children, ...props }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);
    if (!enabled) {
        return null;
    }
    return <Droppable {...props}>{children}</Droppable>;
};

export default function EditorSidebar() {

    const [content, setContent] = useAtom(contentAtom);

    const [pagination, setPagination] = useAtom(paginationAtom);
    const [_, setPage] = useAtom(pageAtom);
    const [builder, setBuilder] = useAtom(builderAtom);

    const [configure, setConfigure] = useAtom(configureAtom);
    const [edited, setEdited] = useAtom(editedAtom);
    const [authenticated, setAuthenticated] = useAtom(authenticatedAtom);
    const [permission, setPermission] = useAtom(permissionAtom);
    const [definitions, setDefinitions] = useAtom(definitionsAtom);

    const [code, setCode] = useAtom(codeAtom);
    const [navigation, setNavigation] = useAtom(navigationAtom);



    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    // const [navigation, setNavigation] = useState('main');

    let defaultRoutes = [
        { icon: <Box size="16" color="#111827" />, title: "Product", id: 'product' },
        { icon: <Code1 size="16" color="#111827" />, title: "API Reference", id: 'api' },
        { icon: <Setting3 size="16" color="#111827" />, title: "Configuration", id: 'configuration' },
    ];

    // useEffect(() => {
    //     console.log("rerendering.the.sidebar", { remote_navigation: navigation, navigation})
    //     if (navigation !== navigation) {
    //         setNavigation(navigation)
    //     }
    // }, [navigation]);

    function HandleAddPage(position, parent_id) {
        // PAGE IS SOMETHING
        let page = {
            type: navigation,
            position: position,
            title: position == 'chapter' ? "Added Chapter Page" : "Added Child Page",
            description: "",
            content: { editor: DEFAULT_INITIAL_PAGE_BLOCKS_DATA, mdx: "" },
            children: [],
            configuration: {
                privacy: "public", // or hidden
                purpose: "page", // or external_link
                depricated: false,
                external_link: { url: "" },
                seo: { image: "", title: "", description: "", slug: "" },
            }
        };
        console.log({ page, parent_id, position });
        let toastId = toast.loading('Adding the new Page...');

        // GET ALL THE LATEST CONTENT
        ContentAPIHandler('POST', page).then(response => {
            console.log('response', response.data);
            toast.success('Child Page created & saved');

            if (parent_id) {
                // AFTER CREATION, OF THE CHILD PAGE
                // ADD IT TO THE PARENTS CHILDREN LIST
                // & UPDATE THE PARENTS DATA
                // OPEN THE PARENTS DROPDOWN
                let parent_page = content.find((page) => page.id == parent_id);
                parent_page.children.push(response.data.id);

                ContentAPIHandler('PUT', parent_page).then(response2 => {
                    console.log('response', response2.data);
                    let newContent = [...content];
                    let parent_page_index = content.findIndex((page) => page.id == parent_id);
                    newContent[parent_page_index] = response2.data;
                    let anew = [...newContent, response.data];
                    setContent(anew)
                    toast.dismiss(toastId);
                    toast.success('Parent Page updated & saved');
                }).catch(error => {
                    console.log('error', error);
                    toast.dismiss(toastId);
                });

            } else {
                let anew = [...content, response.data];
                setContent(anew);
                toast.dismiss(toastId);
            }

        }).catch(error => {
            console.log('error', error);
            toast.dismiss(toastId);
            toast.error('Got an error saving this page!');
        })

    }

    function HandleDeletePage(page) {
        let toastId = toast.loading('Deleting this Page...');

        ContentAPIHandler('DELETE', page).then(response2 => {
            let newContent = content.filter((block) => block.id !== page.id);
            let anew = [...newContent];
            setContent(anew);
            toast.dismiss(toastId);
            toast.success('Page deleted');
        }).catch(error => {
            console.log('error', error);
            toast.error('Got an error deleting this page!');
        });
    }

    function HandleOnDragEnd(result) {
        console.log("sorting.result.data", { result, content: content });
        // dropped outside the list
        if (!result.destination) {
            return;
        }
        let startIndex = result.source.index;
        let endIndex = result.destination.index;
        console.log("sorting.operational.data", { startIndex, endIndex });

        // let result = Array.from(content);
        // let removed = result.splice(startIndex, 1);
        // result.splice(endIndex, 0, removed);
        // console.log("Sorted.list", result);

        // FIND THE PARENT
        // MOVE THE ID AT THE END TO THE DROPED INDEX
        let parent_page = content.find((page, index) => page.id == result.destination.droppableId);
        let parent_page_index = content.findIndex((page, index) => page.id == result.destination.droppableId);

        let active_pages = parent_page?.children.filter(id => content.some(page => page.id == id));
        let dragged_page = content.find(page => page.id == result.draggableId);
        let dropped_on_page = content.find((page) => page.id == active_pages[endIndex]);

        console.warn("side.bar.navigation.pages.before.refresh", { parent_page, parent_page_index, dragged_page, dropped_on_page });
        if (dropped_on_page) {
            parent_page.children = active_pages;
            parent_page.children[endIndex] = dragged_page.id;
            parent_page.children[startIndex] = dropped_on_page.id;

            let newContent = [...content];
            newContent[parent_page_index] = parent_page;
            setContent(newContent);
            console.warn("side.bar.navigation.pages.refreshed", { parent_page, parent_page_index, newContent });
        }
    }

    const HandleMoveToAPage = (page) => {
        // CHECK IF THE USER HAS EDITED THE CURRENT PAGE
        // TAKE PERMISSION FROM HIM BEFORE MOVING 
        // - USE A PROMPT TO SHOW A JSX DIALOG (INFITELY)
        // - BASED ON THE RESPONSE HANDLE THE NEXT STEP BY THE STATE OF
        if (page.type !== 'book') {
            if (edited == true) {
                let permission = confirm("You have unsaved work on this page, do you still want to move to a new page without saving it?");
                console.log("permission.after.clicking.div", permission);
                switch (permission) {
                    case true:
                        // RESET THE PAGE'S OLD DATA BEFORE ROUTING
                        // UPDATE THE ACTUAL CONTENT STATE WITH THE NEW DATA WE ARE GETTING + THE PAGE BLOCK CURRENTLY SET
                        let index = content.findIndex(page => page.id == page?.id);
                        let anew = content;
                        anew[index] = page;
                        setContent(anew);
                        setEdited(false);
                        setBuilder({});
                        router.push(`/editor/product/?page=${page.id}`, undefined, { shallow: true });
                        break;
                    case false:
                        break;
                }
            } else {
                // setBuilder({});
                // router.push(`/editor/${navigation}/?page=${page.id}`, undefined, { shallow: true });
                // router.push('/editor/product?page=365470494298734672', { shallow: true });

                const newUrl = `/editor/${navigation}?page=${page.id}`
                window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

                let found = content.find(pa => pa.id == page.id);
                console.log("page.loaded.from.current.content", { found });
                setPage(found);

                // router.push({
                //     pathname: `/editor/${navigation}`,
                //     query: {
                //         page: page.id,
                //     }
                // }, undefined, { shallow: true })
            }
        }
    }

    const HandleBacktoMain = () => {
        // CHECK IF THE USER HAS EDITED THE CURRENT PAGE
        // TAKE PERMISSION FROM HIM BEFORE MOVING 
        // - USE A PROMPT TO SHOW A JSX DIALOG (INFITELY)
        // - BASED ON THE RESPONSE HANDLE THE NEXT STEP BY THE STATE OF
        if (edited == true) {
            let permission = confirm("You have unsaved work on this page, do you still want to move to a new page without saving it?");
            console.log("permission.after.clicking.div", permission);
            if (permission) {
                let index = content.findIndex(page => page.id == page?.id);
                let anew = content;
                anew[index] = page;
                setPage();
                setEdited(false);
                setBuilder({});
                setContent(anew);

                router.push(`/editor`);
            }
        } else {
            setBuilder({});
            setPage();
            router.push(`/editor`);
        }
    }

    const HandleLogOut = () => {
        localStorage.removeItem("authenticated");
        setAuthenticated(false);
    }

    const Indicators = (page) => {
        // IF THE VALUE IS API
        // RETURN A INDICATOR OF 
        if (page.type == "api" && page.content.api.type) {
            let colors = { get: "success", post: "info", put: "indigo", delete: "failure", patch: "warning" }
            return <Badge color={colors[page.content.api.type]} className='inline ml-2'>{page.content.api.type}</Badge>
        }
    }

    const Directory = ({ directoryPage }) => {
        // KNOW IF THIS PAGE IS OPENED OR NOT
        let pagination = JSON.parse(localStorage.getItem('pagination'));
        let mapping = pagination[directoryPage?.id];
        let pageOpened = mapping !== undefined ? mapping : false;
        if (directoryPage?.id == 'book') {
            pageOpened = true;
        }

        const [isExpanded, toggleExpanded] = useState(pageOpened);
        const [isShown, setIsShown] = useState(false);

        const pages = content;

        if (directoryPage?.id) {
            let activeChildrenPages = directoryPage.children.filter(id => pages.some(paged => paged.id === id));
            {/* Page name > Then children pages */ }
            if (activeChildrenPages.length > 0) {
                return (
                    <DragDropContext onDragEnd={HandleOnDragEnd}>
                        <StrictModeDroppable droppableId={`${directoryPage.id}`}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`${snapshot.isDraggingOver == true ? '' : ''}`}>

                                    <div className={`${directoryPage.id == 'book' ? '' : ''} ${directoryPage.position == 'child' ? 'folder' : ''}`}>
                                        <div className={`${directoryPage.position === 'child' ? 'folder flex flex-row w-100 justify-between items-center cursor-pointer' : 'flex justify-between items-center cursor-pointer'} `}
                                        // onMouseEnter={() => setIsShown(true)} 
                                        // onMouseLeave={() => setIsShown(false)}
                                        >

                                            <div className='flex flex-row items-center'>
                                                {directoryPage.id != 'book' &&
                                                    <h2 className="folder-title text-sm font-medium flex items-center p-1 border ml-2"
                                                        onClick={() => {
                                                            let change = !isExpanded;
                                                            toggleExpanded(change);
                                                            console.log("clicked.on.for.moving.id", directoryPage.id);

                                                            // cold store
                                                            let toStore = { ...JSON.parse(localStorage.getItem('pagination')) };
                                                            toStore[directoryPage.id] = change;
                                                            localStorage.setItem('pagination', JSON.stringify(toStore));
                                                        }}>
                                                        {isExpanded == true ?
                                                            <ArrowDown2 size="16" color="#111827" />
                                                            :
                                                            <ArrowRight2 size="16" color="#111827" />
                                                        }
                                                    </h2>
                                                }
                                                <h3 className={`${directoryPage.id == 'book' ? '' : 'file-name font-normal'} flex flex-row text-sm overflow-hidden`}
                                                    onClick={() => {
                                                        HandleMoveToAPage(directoryPage);
                                                    }}>
                                                    {directoryPage.title} {Indicators(directoryPage)}
                                                </h3>
                                            </div>

                                            {directoryPage.id === 'book' ?
                                                <Button size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>
                                                :
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
                                                        <Dropdown.Item onClick={() => HandleDeletePage(directoryPage)}>
                                                            Delete
                                                        </Dropdown.Item>
                                                    </Dropdown>

                                                    <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                                        onClick={() => { HandleAddPage("child", directoryPage.id) }}>
                                                        <span className='leading-none'>+</span>
                                                    </div>
                                                </div>
                                            }
                                        </div>

                                        <br />
                                        {/* {isExpanded == true && page.children.map((id) => < Directory key={id} page={pages.find(paged => paged.id === id)} />)} */}
                                        {activeChildrenPages.map((id, index) => {
                                            let found = pages.find(paged => paged.id === id);
                                            let activeFoundPages = found.children.filter(id => pages.some(paged => paged.id === id));
                                            if (found) {
                                                return (
                                                    <Draggable
                                                        key={found.id}
                                                        draggableId={found.id}
                                                        index={index}
                                                        isDragDisabled={activeFoundPages.length > 0 ? true : false}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`${snapshot.isDragging == true ? 'bg-gray-100' : ''} `}
                                                            >
                                                                {/* {page.title} */}
                                                                <Directory page={found} directoryPage={found} />
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            } else {
                                                return <div key={index}></div>
                                            }
                                        })}

                                    </div>
                                    {/* // End of draggable */}
                                    {provided.placeholder}
                                </div >
                            )}
                        </StrictModeDroppable>
                    </DragDropContext>
                )
            }

            {/* Page name */ }
            let allowed = directoryPage?.position == 'chapter';
            return (
                <>
                    <div className={`${directoryPage.position === 'child' ? 'ml-5' : ''} flex flex-row w-100 justify-between items-center cursor-pointer`}
                    // onMouseEnter={() => { setIsShown(true); }} 
                    // onMouseLeave={() => { setIsShown(false) }}
                    >
                        <div className='flex flex-row w-100 items-center'>
                            {allowed &&
                                <h2 className="folder-title border text-sm font-medium flex items-center p-1 ml-2"
                                    onClick={() => {
                                        let change = !isExpanded;
                                        toggleExpanded(change);

                                        // cold store
                                        let toStore = { ...JSON.parse(localStorage.getItem('pagination')) };
                                        toStore[directoryPage.id] = change;
                                        localStorage.setItem('pagination', JSON.stringify(toStore));
                                    }}>
                                    {isExpanded == true ?
                                        <ArrowDown2 size="16" color="#111827" />
                                        :
                                        <ArrowRight2 size="16" color="#111827" />
                                    }
                                </h2>
                            }

                            <h3 className="file-name text-sm overflow-hidden text-ellipsis flex flex-row"
                                onClick={() => {
                                    HandleMoveToAPage(directoryPage);
                                }}>
                                {directoryPage.title} {Indicators(directoryPage)}
                            </h3>
                        </div>


                        {directoryPage.id === 'book' ?
                            <Button size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>
                            :
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
                                    <Dropdown.Item onClick={() => HandleDeletePage(directoryPage)}>
                                        Delete
                                    </Dropdown.Item>
                                </Dropdown>

                                <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                    onClick={() => { HandleAddPage("child", directoryPage.id) }}>
                                    <span className='leading-none'>+</span>
                                </div>
                            </div>
                        }
                    </div>
                    <br />
                </>
            )
        }
    }

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
                    <li >
                        <p onClick={HandleLogOut} className="cursor-pointer flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Logout size="16" color="#111827" />
                            <span className="ml-3"> Log out</span>
                        </p>
                    </li>
                </ul>

            </div >
        )
    }

    // COMPLETED: MADE ALOT CHANGES DOWN THIS TREEE OF COMPONENTS
    function SubPageNavigation() {

        // CONFIGURA
        // let navigation = "api"

        // GET ALL THE FIRST PARENTS UNDER THIS PAGE
        let productChapters = content.filter(child => child?.type === navigation && child?.position === 'chapter')
        let book = {
            id: "book",
            position: 'book',
            title: navigation == "product" ? "Product Documentation" : "API Documentation",
            description: "The book itself (The page for it)",
            content: { editor: "", mdx: "" },
            children: productChapters.map(main => main.id),
            configuration: {}
        };

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

        // console.log("sidebar.book.menu.refreshed", book);
        return (
            <div className="h-full px-3 py-4 overflow-x-hidden bg-gray-50 dark:bg-gray-800 justify-between">

                <ul className="font-medium mb-4">
                    <li>
                        <p onClick={HandleBacktoMain} className="border cursor-pointer flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft size="16" color="#111827" />
                            <span className="ml-3"> Back</span>
                        </p>
                    </li>
                    {
                        navigation == 'api' &&
                        <li>
                            < p onClick={() => setDefinitions(true)} className="border cursor-pointer mt-3 flex justify-between items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                <span className="ml-2 text-gray-700"> Specification File</span>
                                <Code1 size="16" color="#111827" />
                            </p>
                        </li>
                    }
                </ul>

                <div className="mt-4 mb-4" id="directory-list">
                    <Directory page={book} directoryPage={book} />
                </div>
            </div>
        )
    }

    return (
        <aside id="default-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
            {navigation == 'main' ? MainNavigation() : SubPageNavigation()}
        </aside>
    )
}
