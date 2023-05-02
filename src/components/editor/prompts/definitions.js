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

export default function APIDefinitionsPrompt(props) {

    const inputRef = React.useRef();

    const HandleSetConfiguration = () => {

    }

    return (
        <Modal size="md" show={props.definitions} onClose={() => { props.setDefinitions(false); }} popup={true}>

            <Modal.Header className='text-sm !p-5 !pb-0'>
                <p>Create API Pages </p>
            </Modal.Header>

            <Modal.Body>
                <div className="space-y-2">

                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Spec Files supported (Swagger & Open-API 3.0.0 {'>or='} )
                    </p>

                    <TextInput
                        id="code-area"
                        placeholder="Paste the URL to the Spec File"
                        required={true}
                        rows={4}
                        className='text-sm'
                    />

                    {/* 
                    <Tabs.Group aria-label="Tabs with underline" style="underline" className="p-0 [&>p]:border">
                        <Tabs.Item title="Via URL"  className="!p-0 ![&>button]:border" >
                            <Textarea
                                id="code-area"
                                placeholder="SPEC JSON"
                                required={true}
                                rows={4}
                                className='text-sm'
                            />
                        </Tabs.Item>
                        <Tabs.Item active={true} title="Via Input"  className="!p-0">
                            <Textarea
                                id="code-area"
                                placeholder="SPEC JSON"
                                required={true}
                                rows={4}
                                className='text-sm'
                            />
                        </Tabs.Item>
                    </Tabs.Group> */}

                </div>
            </Modal.Body>
            <Modal.Footer className='border-t border pt-4 pb-4'>
                <Button size={"sm"}>
                    Generate
                </Button>
                <Button size={"sm"} color="gray" onClick={() => { props.setDefinitions(false) }}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}