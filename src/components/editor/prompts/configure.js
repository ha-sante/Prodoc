import { useEffect, useRef } from 'react';
import { Tabs, Accordion, Card, Button, Modal, TextInput, Textarea } from "flowbite-react";
import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import {
    store, contentAtom, pageAtom, builderAtom, paginationAtom, configureAtom,
    editedAtom, authenticatedAtom, permissionAtom, definitionsAtom, codeAtom, navigationAtom,
    DEFAULT_INITIAL_PAGE_BLOCKS_DATA, DEFAULT_PAGE_DATA, ContentAPIHandler, StorageHandler
} from '../../../context/state';
import { useStore, useAtom } from "jotai";

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another


import JSON5 from 'json5'
import { toast } from 'react-hot-toast';

export default function ConfigurePagePrompt(props) {
    const [content, setContent] = useAtom(contentAtom);
    const [page, setPage] = useAtom(pageAtom);
    const [configure, setConfigure] = useAtom(configureAtom);
    const [edited, setEdited] = useAtom(editedAtom);
    const [code, setCode] = useAtom(codeAtom);

    const inputRef = useRef();

    useEffect(() => {
        console.log("set.page.configuration", { ref: inputRef.current, code, page })
        if (inputRef.current && page) {
            let found = content.find(item => item?.id == page?.id);
            let value = JSON.stringify(found?.configuration, undefined, 4);
            inputRef.current.value = JSON.stringify(found?.configuration, undefined, 4);
            setCode(value)
        }
    }, [configure]);

    const HandleSetConfiguration = () => {
        if (inputRef.current) {
            // GET THE UPDATED VALUE
            let update = inputRef.current.value;
            // console.log("configuration.updated", update);

            // SET IT TO CONTENT LIST (PAGE)
            let new_configuration = eval('(' + update + ')');

            // CALL FOR UPDATE INDICATORS ETC
            let ready = page;
            ready.configuration = new_configuration;
            console.log("set.configuration", { ready });
            setPage(ready);
            setEdited(true);
            setConfigure(false);
            StorageHandler.set(`edited`, true);
        } else {
            toast.error("Unable to save this data")
        }
    }

    return (
        <Modal id="configure-modal" size="md" show={configure} onClose={() => { setConfigure(false); }} popup={true}>

            <Modal.Header className='text-sm !p-5 !pb-0'>
                <p>Page Configuration</p>
            </Modal.Header>

            <Modal.Body>
                <div className="space-y-2">
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Your page configuration is a combination of both required data properties and as well anything you can think of that
                        your site designer will use in designing the documentation website (for this page only).
                    </p>
                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        The required data types include, privacy=public/hidden, purpose=page/external_link, external_link=url, seo=object(image,title,description,slug)
                    </p>

                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        The content below should be a complaint javascript object
                        (<a className='text-blue-600' target="_blank" href='https://www.w3schools.com/js/js_objects.asp'>Help</a>)
                    </p>

                    {/* <p> {JSON.stringify(page?.configuration)} </p> */}

                    <Textarea
                        id="code-area"
                        placeholder="Write page configuration as a Javascript Object"
                        required={true}
                        rows={4}
                        className='text-sm'
                        defaultValue={code}
                        ref={inputRef}
                    />

                </div>
            </Modal.Body>
            <Modal.Footer className='border-t border pt-4 pb-4'>
                <Button size={"sm"} onClick={HandleSetConfiguration}>
                    Set
                </Button>
                <Button size={"sm"} color="gray" onClick={() => { setConfigure(false); }}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}