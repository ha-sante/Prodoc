import { default as React } from 'react';
import {
    Accordion,
    Alert,
    Avatar,
    Badge,
    Breadcrumb,
    Button,
    Card,
    Carousel,
    Checkbox,
    Dropdown,
    FileInput,
    Footer,
    HelperText,
    Label,
    Modal,
    Navbar,
    Pagination,
    Progress,
    Radio,
    RangeSlider,
    Rating,
    Select,
    Sidebar,
    Spinner,
    ListGroup,
    DarkThemeToggle,
    Tabs,
    Table,
    Textarea,
    TextInput,
    Timeline,
    Toast,
    ToggleSwitch,
    Tooltip
} from "flowbite-react";

import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another
import StringToReactComponent from 'string-to-react-component';

export default function Wrapper(props) {
    const [code, setCode] = React.useState(`${props.data.code}`);
    const [mode, setMode] = React.useState('preview');

    React.useEffect(() => {
        // console.log('wrapper.code.changed', code);
        if (props.onDataChange) {
            props.onDataChange(code);
        }
    }, [code]);

    const changeEditingMode = (option) => {
        setMode(option);
    }

    const ReturnPreviewMode = () => {
        return (
            <StringToReactComponent data={{
                Alert,
                Avatar,
                Badge,
                Breadcrumb,
                Button,
                Card,
                Carousel,
                Checkbox,
                Dropdown,
                FileInput,
                Footer,
                HelperText,
                Label,
                Modal,
                Navbar,
                Pagination,
                Progress,
                Radio,
                RangeSlider,
                Rating,
                Select,
                Sidebar,
                Spinner,
                ListGroup,
                DarkThemeToggle,
                Tabs,
                Table,
                Textarea,
                TextInput,
                Timeline,
                Toast,
                ToggleSwitch,
                Tooltip
            }}>
                {`(props)=>{
               const {
                Alert,
                Avatar,
                Badge,
                Breadcrumb,
                Button,
                Card,
                Carousel,
                Checkbox,
                Dropdown,
                FileInput,
                Footer,
                HelperText,
                Label,
                Modal,
                Navbar,
                Pagination,
                Progress,
                Radio,
                RangeSlider,
                Rating,
                Select,
                Sidebar,
                Spinner,
                ListGroup,
                DarkThemeToggle,
                Tabs,
                Table,
                Textarea,
                TextInput,
                Timeline,
                Toast,
                ToggleSwitch,
                Tooltip}=props;
               return (<>
                ${code}
               </>);
             }`}
            </StringToReactComponent>
        )
    }

    const ReturnEditMode = () => {
        return (
            <div className='w-100'>
                <Editor
                    value={code}
                    onValueChange={code => setCode(code)}
                    highlight={code => {
                        console.log("code.to.be.highlighted", code);
                        if (typeof code == 'string') {
                            return highlight(code, languages.js)
                        } else {
                            return highlight('', languages.js)
                        }
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