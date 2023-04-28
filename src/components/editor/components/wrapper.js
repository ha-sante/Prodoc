import { default as React } from 'react';
import { Button } from "flowbite-react";
import { Tabs, Accordion, Card } from "flowbite-react";

import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

import StringToReactComponent from 'string-to-react-component';


export default function Wrapper(props) {
    const [content, setContent] = React.useState('// Paste & Edit the component code here (Delete this whiles doing so)');
    const [mode, setMode] = React.useState('edit');

    React.useEffect(() => {
        if (props.onDataChange) {
            // Inform editorjs about data change
            props.onDataChange(content);
          }
    }, [content]);

    const changeEditingMode = (option) => {
        setMode(option);
    }

    const ReturnPreviewMode = () => {
        return (
            <StringToReactComponent data={{ Tabs, Accordion, Card }}>
                {`(props)=>{
               const {Tabs}=props;
               return (<>
                ${content}
               </>);
             }`}
            </StringToReactComponent>
        )
    }

    const ReturnEditMode = () => {
        return (
            <div className='w-100'>
                <Editor
                    value={content}
                    onValueChange={code => setContent(code)}
                    highlight={code => highlight(code, languages.js)}
                    padding={10}
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                    }}
                />
            </div>
        )
    }

    return (
        <React.Fragment>
            <div className='p-2 border rounded'>

                <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded">
                    <div>
                        <Button
                            size="xs"
                            onClick={() => changeEditingMode('edit')}
                            className={mode === 'edit' ? 'text-black bg-blue-600 border' : '!bg-white !text-black border hover:text-black hover:bg-white'}>
                            Edit
                        </Button>
                    </div>
                    <div>
                        <Button
                            size="xs"
                            onClick={() => changeEditingMode('preview')}
                            className={mode === 'preview' ? 'text-black bg-blue-600 border' : '!bg-white !text-black border hover:text-black hover:bg-white'}>
                            Preview
                        </Button>
                    </div>
                    <div>
                        <a href="https://flowbite-react.com/" target="_blank" className='!no-underline'>
                            <Button size="xs" color={'#fff'} className='border'>
                                Components <ExportCircle size="16" color="#FF8A65" className='ml-2' />
                            </Button>
                        </a>
                    </div>
                    <div>
                        <Button size="xs" color={'#fff'} className='border'>
                            Guide <Book1 size="16" color="#FF8A65" className='ml-2' />
                        </Button>
                    </div>
                </div>

                <div className='border rounded w-100'>
                    {
                        mode == 'preview' ?
                            ReturnPreviewMode()
                            :
                            ReturnEditMode()
                    }
                </div>

            </div>
        </React.Fragment>
    );
}