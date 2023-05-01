import { default as React } from 'react';
import { Tabs, Accordion, Card, Button, Modal, TextInput, Textarea } from "flowbite-react";
import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import { AppStateContext } from '../../../context/state';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another


import JSON5 from 'json5'
import { toast } from 'react-hot-toast';

export default function ConfigurePagePrompt(props) {
    const AppState = React.useContext(AppStateContext);
    const [code, setCode] = React.useState('');

    const typingRef = React.useRef();
    const editorRef = React.useRef();

    React.useEffect(() => {
        // console.log('state.code.changed', { code, type: typeof code });
        if (typingRef?.current) {
            typingRef.current.focus();
        }
    }, [code]);


    React.useEffect(() => {
        // console.log("config.started", typingRef);
        if (typingRef.current && code == "") {
            typingRef.current.value = AppState.code;
        }
    }, [AppState.configure]);

    const ReturnEditMode = () => {
        return (
            <div className='w-100 border'>
                <Editor
                    ref={editorRef}
                    // value={AppState.code}
                    onValueChange={code => console.log(code)}
                    highlight={code => {
                        let update = typingRef.current?.value;
                        console.log("code.to.be.highlighted", update);
                        return highlight(update ? update : '', languages.js)

                        // if (typeof code == 'string') {
                        //     return highlight(code, languages.js)
                        // } else {
                        //     return highlight('', languages.js)
                        // }
                    }}
                    padding={10}
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                    }}
                />
            </div>
        )
    }

    const HandleSetConfiguration = () => {
        console.log("configuration.typingRef", { value: typingRef.current.value, props });
        if (typingRef.current && props?.HandleConfigurationChange) {
            let update = typingRef.current.value;
            console.log("configuration.updated", update);

            // check if this page
            props?.HandleConfigurationChange(update)
        }else{
            toast.error("Unable to save this data")
        }
    }

    return (
        <Modal size="md" show={AppState.configure} onClose={() => { AppState.setConfigure(false); }} popup={true}>

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
                        The required data types include, privacy=public/hidden, purpose=page/external_link, external_link=url, seo=object(title, image, slug)
                    </p>

                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        The content below should be a complaint javascript object 
                        (<a className='text-blue-600' target="_blank" href='https://www.w3schools.com/js/js_objects.asp'>Help</a>)
                    </p>

                    <Textarea
                        id="code-area"
                        placeholder="Write page configuration as a Javascript Object"
                        required={true}
                        rows={4}
                        className='text-sm'
                        ref={typingRef}
                    />

                </div>
            </Modal.Body>
            <Modal.Footer className='border-t border pt-4 pb-4'>
                <Button size={"sm"} onClick={HandleSetConfiguration}>
                    Set
                </Button>
                <Button size={"sm"} color="gray" onClick={() => { AppState.setConfigure(false) }}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}