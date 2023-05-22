import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, memo } from "react";
import { useRouter } from 'next/router'

import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

import { Label, TextInput, Checkbox, Button, Dropdown, Badge } from "flowbite-react";
import { Box, Logout, Code1, Setting3, LogoutCurve, ArrowLeft, ArrowRight2, ArrowDown2, Add, More2, More, HambergerMenu, Menu, Fatrows, CloudConnection } from 'iconsax-react';

import { AppStateContext } from '../../context/state';
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
    const AppState = useContext(AppStateContext);
    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    const [navigation, setNavigation] = useState('main');

    let defaultRoutes = [
        { icon: <Box size="16" color="#111827" />, title: "Product", id: 'product' },
        { icon: <Code1 size="16" color="#111827" />, title: "API Reference", id: 'api' },
        { icon: <Setting3 size="16" color="#111827" />, title: "Configuration", id: 'configuration' },
    ];

    // useEffect(() => {
    //     console.log("rerendering.the.sidebar", { remote_navigation: AppState.navigation, navigation})
    //     if (AppState.navigation !== navigation) {
    //         setNavigation(AppState.navigation)
    //     }
    // }, [AppState.navigation]);

    function HandleAddPage(position, parent_id) {
        // PAGE IS SOMETHING
        let page = {
            type: AppState.navigation,
            position: position,
            title: position == 'chapter' ? "Added Chapter Page" : "Added Child Page",
            description: "",
            content: { editor: AppState.DEFAULT_INITIAL_PAGE_BLOCKS_DATA, mdx: "" },
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
                    let anew = [...newContent, response.data];
                    AppState.setContent(anew)
                    toast.dismiss(toastId);
                    toast.success('Parent Page updated & saved');
                }).catch(error => {
                    console.log('error', error);
                    toast.dismiss(toastId);
                });

            } else {
                let anew = [...AppState.content, response.data];
                AppState.setContent(anew);
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

        AppState.ContentAPIHandler('DELETE', page).then(response2 => {
            let newContent = AppState.content.filter((block) => block.id !== page.id);
            let anew = [...newContent];
            AppState.setContent(anew);
            toast.dismiss(toastId);
            toast.success('Page deleted');
        }).catch(error => {
            console.log('error', error);
            toast.error('Got an error deleting this page!');
        });
    }

    function HandleOnDragEnd(result) {
        console.log("sorting.result.data", { result, content: AppState.content });
        // dropped outside the list
        if (!result.destination) {
            return;
        }
        let startIndex = result.source.index;
        let endIndex = result.destination.index;
        console.log("sorting.operational.data", { startIndex, endIndex });

        // let result = Array.from(AppState.content);
        // let removed = result.splice(startIndex, 1);
        // result.splice(endIndex, 0, removed);
        // console.log("Sorted.list", result);

        // FIND THE PARENT
        // MOVE THE ID AT THE END TO THE DROPED INDEX
        let parent_page = AppState.content.find((page, index) => page.id == result.destination.droppableId);
        let parent_page_index = AppState.content.findIndex((page, index) => page.id == result.destination.droppableId);

        let active_pages = parent_page?.children.filter(id => AppState.content.some(page => page.id == id));
        let dragged_page = AppState.content.find(page => page.id == result.draggableId);
        let dropped_on_page = AppState.content.find((page) => page.id == active_pages[endIndex]);

        console.warn("side.bar.navigation.pages.before.refresh", { parent_page, parent_page_index, dragged_page, dropped_on_page });
        if (dropped_on_page) {
            parent_page.children = active_pages;
            parent_page.children[endIndex] = dragged_page.id;
            parent_page.children[startIndex] = dropped_on_page.id;

            let newContent = [...AppState.content];
            newContent[parent_page_index] = parent_page;
            AppState.setContent(newContent);
            console.warn("side.bar.navigation.pages.refreshed", { parent_page, parent_page_index, newContent });
        }
    }

    const HandleMoveToAPage = (page) => {
        // CHECK IF THE USER HAS EDITED THE CURRENT PAGE
        // TAKE PERMISSION FROM HIM BEFORE MOVING 
        // - USE A PROMPT TO SHOW A JSX DIALOG (INFITELY)
        // - BASED ON THE RESPONSE HANDLE THE NEXT STEP BY THE STATE OF
        if (page.type !== 'book') {
            if (AppState.edited == true) {
                let permission = confirm("You have unsaved work on this page, do you still want to move to a new page without saving it?");
                console.log("permission.after.clicking.div", permission);
                switch (permission) {
                    case true:
                        // RESET THE PAGE'S OLD DATA BEFORE ROUTING
                        // UPDATE THE ACTUAL CONTENT STATE WITH THE NEW DATA WE ARE GETTING + THE PAGE BLOCK CURRENTLY SET
                        let index = AppState.content.findIndex(page => page.id == AppState?.page?.id);
                        let anew = AppState.content;
                        anew[index] = AppState?.page;
                        AppState.setContent(anew);
                        AppState.setEdited(false);
                        AppState.setBuilder({});
                        router.push(`/editor/product/?page=${page.id}`, undefined, { shallow: true });
                        break;
                    case false:
                        break;
                }
            } else {
                // AppState.setBuilder({});
                router.push(`/editor/${AppState.navigation}/?page=${page.id}`, undefined, { shallow: true })
            }
        }
    }

    const HandleBacktoMain = () => {
        // CHECK IF THE USER HAS EDITED THE CURRENT PAGE
        // TAKE PERMISSION FROM HIM BEFORE MOVING 
        // - USE A PROMPT TO SHOW A JSX DIALOG (INFITELY)
        // - BASED ON THE RESPONSE HANDLE THE NEXT STEP BY THE STATE OF
        if (AppState.edited == true) {
            let permission = confirm("You have unsaved work on this page, do you still want to move to a new page without saving it?");
            console.log("permission.after.clicking.div", permission);
            if (permission) {
                let index = AppState.content.findIndex(page => page.id == AppState?.page?.id);
                let anew = AppState.content;
                anew[index] = AppState?.page;
                AppState.setPage();
                AppState.setEdited(false);
                AppState.setBuilder({});
                AppState.setContent(anew);
                router.push(`/editor`);
            }
        } else {
            AppState.setBuilder({});
            AppState.setPage();
            router.push(`/editor`);
        }
    }

    const HandleLogOut = () => {
        localStorage.removeItem("authenticated");
        AppState.setAuthenticated(false);
    }

    const Indicators = (page) => {
        // IF THE VALUE IS API
        // RETURN A INDICATOR OF 
        if (page.type == "api" && page.content.api.type) {
            let colors = { get: "success", post: "info", put: "indigo", delete: "failure", patch: "warning" }
            return <Badge color={colors[page.content.api.type]} className='inline ml-2'>{page.content.api.type}</Badge>
        }
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

        if (page?.id) {
            let activeChildrenPages = page.children.filter(id => pages.some(paged => paged.id === id));
            {/* Page name > Then children pages */ }
            if (activeChildrenPages.length > 0) {
                return (
                    <DragDropContext onDragEnd={HandleOnDragEnd}>
                        <StrictModeDroppable droppableId={`${page.id}`}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`${snapshot.isDraggingOver == true ? '' : ''}`}>

                                    <div className={`${page.id == 'book' ? '' : ''} ${page.position == 'child' ? 'folder' : ''}`}>
                                        <div className={`${page.position === 'child' ? 'folder flex flex-row w-100 justify-between items-center cursor-pointer' : 'flex justify-between items-center cursor-pointer'} `}
                                            onMouseEnter={() => setIsShown(true)} onMouseLeave={() => setIsShown(false)}
                                        >

                                            <div className='flex flex-row items-center'>
                                                {page.id != 'book' &&
                                                    <h2 className="folder-title text-sm font-medium flex items-center p-1 border ml-2"
                                                        onClick={() => {
                                                            let change = !isExpanded;
                                                            toggleExpanded(change);
                                                            console.log("clicked.on.for.moving.id", page.id);

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
                                                <h3 className={`${page.id == 'book' ? '' : 'file-name font-normal'} flex flex-row text-sm overflow-hidden`}
                                                    onClick={() => {
                                                        HandleMoveToAPage(page);
                                                    }}>
                                                    {page.title} {Indicators(page)}
                                                </h3>
                                            </div>

                                            {page.id === 'book' ?
                                                <Button isProcessing={processing} size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>
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
                                                        <Dropdown.Item onClick={() => HandleDeletePage(page)}>
                                                            Delete
                                                        </Dropdown.Item>
                                                    </Dropdown>

                                                    <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                                        onClick={() => { HandleAddPage("child", page.id) }}>
                                                        <span className='leading-none'>+</span>
                                                    </div>
                                                </div>
                                            }
                                        </div>

                                        <br />
                                        {/* {isExpanded == true && page.children.map((id) => < Directory key={id} page={pages.find(paged => paged.id === id)} />)} */}
                                        {isExpanded == true && activeChildrenPages.map((id, index) => {
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
                                                                < Directory key={found.id} page={found} />
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
            let allowed = page?.position == 'chapter';
            return (
                <>
                    <div className={`${page.position === 'child' ? 'ml-5' : ''} flex flex-row w-100 justify-between items-center cursor-pointer`}
                        onMouseEnter={() => { setIsShown(true); }} onMouseLeave={() => { setIsShown(false) }}>
                        <div className='flex flex-row w-100 items-center'>
                            {allowed &&
                                <h2 className="folder-title border text-sm font-medium flex items-center p-1 ml-2"
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

                            <h3 className="file-name text-sm overflow-hidden text-ellipsis flex flex-row"
                                onClick={() => {
                                    HandleMoveToAPage(page);
                                }}>
                                {page.title} {Indicators(page)}
                            </h3>
                        </div>


                        {page.id === 'book' ?
                            <Button isProcessing={processing} size="xs" className='' onClick={() => { HandleAddPage("chapter") }}>+</Button>
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
                                    <Dropdown.Item onClick={() => HandleDeletePage(page)}>
                                        Delete
                                    </Dropdown.Item>
                                </Dropdown>

                                <div className={`${isShown ? 'text-black border h-[20px] w-[20px] grid place-items-center' : 'text-transparent h-[20px] w-[20px]'} font-normal text-lg mr-1`}
                                    onClick={() => { HandleAddPage("child", page.id) }}>
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

    function SubPageNavigation() {

        // GET ALL THE FIRST PARENTS UNDER THIS PAGE
        let productChapters = AppState.content.filter(child => child?.type === AppState.navigation && child?.position === 'chapter')
        let book = {
            id: "book",
            position: 'book',
            title: AppState.navigation == "product" ? "Product Documentation" : "API Documentation",
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
                        AppState.navigation == 'api' &&
                        <li>
                            < p onClick={() => AppState.setDefinitions(true)} className="border cursor-pointer mt-3 flex justify-between items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                <span className="ml-2 text-gray-700"> Specification File</span>
                                <Code1 size="16" color="#111827" />
                            </p>
                        </li>
                    }
                </ul>

                <div className="mt-4 mb-4" id="navigation">
                    <Directory page={book} />
                </div>
            </div>
        )
    }

    return (
        <aside id="default-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
            {AppState.navigation == 'main' ? MainNavigation() : SubPageNavigation()}
        </aside>
    )
}
