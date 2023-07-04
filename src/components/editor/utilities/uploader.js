import Image from 'next/image'
import Link from 'next/link'

import { useState, useEffect, useContext, memo, useMemo, useRef } from "react";
import { useRouter } from 'next/router'
import { DocumentText, Trash, DirectUp, TableDocument } from 'iconsax-react';

import { Progress, Badge } from 'flowbite-react';

import {
    StorageAPIHandler
} from '../../../context/state';

// Import the plugins
import { FilePond, registerPlugin } from 'react-filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css'

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation)

import { parse as ParseContentDisposition } from 'content-disposition-attachment';
const mimeTypes = require("mime-types");
const contentDisposition = require('content-disposition')

export default function Uploader(props) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState(null); // null, uploaded, success, failed
    const [progress, setProgress] = useState(0); // PERCENT ONLY
    const [image, setImage] = useState("#"); // FOR IMAGE PREVIEWS
    const [init, setInit] = useState(false); // FOR INITIAL FILES
    const [indicate, setIndicate] = useState(false);

    // THE UPLOADER IS SIMPLY AN UPLOAD ONLY
    // PREVIEWS IS SHOWN IN ANOTHER COMPONENT
    const PickFile = () => {
        // OPEN THE FILE OPENER TO GE TTHE FILE
        let filePicker = document.getElementById("file-upload-input");
        filePicker.click();
    }

    const UploadFile = async (event) => {
        let file = event.target.files[0];

        let match = props?.accept ? props.accept : false;
        let allow = match == false ? true : file.type.match(match);

        if (file && allow) {
            setStatus("uploading")
            // UPLOAD THE FILE
            setFile(event.target.files[0]);
            if (!file) {
                return;
            }
            // console.log(file)

            function handleProgress(status, service, file) {
                // console.log("progress.called", { status, service, file })
                let numerator = 0;
                let denominator = 0;
                let percent = 0;

                switch (service) {
                    case "azure":
                        // CALCULATE FILE SIZE PERCENT
                        numerator = status.loadedBytes;
                        denominator = file.size;
                        percent = (numerator / denominator) * 100;
                        setProgress(percent);
                        if (percent == 100) {
                            setProgress(0);
                            setStatus("uploaded");
                            setIndicate(true);
                        }
                        break;
                    case "uploadcare":
                        // CALCULATE FILE SIZE PERCENT
                        percent = status.value * 100;;
                        setProgress(percent);
                        if (percent == 100) {
                            setProgress(0);
                            setIndicate(true);
                            setStatus("uploaded");
                            setIndicate(true);
                        }
                }
            }

            let url = await StorageAPIHandler(file, file.name, handleProgress);

            if (file.type.includes("image")) {
                setImage(url);
            }
            // console.log("file.uploaded", { url });
            props?.events({ type: "uploaded", url });
        } else {
            alert("Not an image file")
        }
    };

    const SetFile = (url) => {
        // NEED FILE NAME & IMAGE
        fetch(url, { method: "HEAD", headers: { 'Access-Control-Expose-Headers': 'Content-Disposition' }, }).then(response => {

            let allow = true;
            if (allow) {
                // FILE DETAILS
                let fileDetails = {
                    size: response.headers.get("Content-Length"),
                    type: response.headers.get("Content-Type"),
                    name: "",
                    disposition: response.headers.get("Content-Disposition"),
                };
                console.log("setfile", { response, fileDetails });

                // FILE EXTENSIONS
                let extension = mimeTypes.extension(fileDetails.type);

                // FILE NAME
                if (url?.includes("core.windows.net")) {
                    let filename = url.split('/').pop();
                    fileDetails.name = `${filename}`;
                } else if (url?.includes("ucarecdn.com")) {
                    let filename = url.split('/').pop();
                    fileDetails.name = `${filename}.${extension}`;
                } else {
                    // USE CONTENT DISPOSITION
                    if (fileDetails.disposition) {
                        let filename = contentDisposition.parse(`${fileDetails.disposition}`)?.parameters?.filename;
                        fileDetails.name = `${filename}.${extension}`;
                    } else {
                        // USE PLACEHOLDER
                        fileDetails.name = "placeholder-name." + extension;
                    }
                }

                setFile(fileDetails);
                setStatus("uploaded");
                setProgress(0);
                console.log("fileDetails", { url, fileDetails })

                if (fileDetails.type?.includes("image")) {
                    setImage(props.init);
                    setInit(false);
                }
            }

        }).catch(error => {
            console.log("error", error)
        });
    }

    const ResetUploader = ({ emit }) => {
        setFile(null);
        setStatus(null);
        setProgress(0);
        setImage("#");
        setInit(false);
        setIndicate(false)

        console.log("uploader.reset")
        if (emit) {
            props?.events({ type: "removed", url: "" });
        }
    }

    useEffect(() => {
        console.log("uploader.init", { props })

        setInit(true);
        if (props.init) {
            SetFile(props.init);
        } else {
            // RESET THE 
            ResetUploader(false);
        }

    }, [props]);

    useEffect(() => {
        if (status == "uploading") {
            let preview = document.getElementById("file-preview");
            if (file && preview) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // preview.src = event.target.result;
                    setImage(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        } else {
            setProgress(0);
        }
    }, [status]);

    const UploaderProcessView = () => {
        switch (status) {
            case null:
                return (
                    <div className='w-[100%] h-[100%] bg-gray-100 flex items-center rounded-md'>

                        <div className='text-center mx-auto' onClick={() => PickFile()}>
                            <p className='text-gray-900 text-sm flex gap-2 items-center'>Upload File <DirectUp size="16" className="text-gray-900" /> </p>
                            <input type="file" name="file" onChange={UploadFile} id="file-upload-input" className='hidden' accept={props.accept != undefined ? props.accept : "*"} />
                        </div>

                    </div>
                )
            case "uploading":
            case "uploaded":
                let render_image_preview = status == "uploaded" && image !== "#";
                return (
                    <div className='w-[100%] h-[100%] progressbar-wrapper items-center rounded-md bg-gray-100'>

                        <div className="progressbar rounded-md" style={{ width: `${Math.round(progress)}%` }}></div>

                        <div className='mx-auto w-100 h-[100%] flex items-center p-2'>
                            <div className="flex justify-between items-center w-[100%]">

                                <div className='!w-[85%] flex justify-start gap-1 items-center'>
                                    <div className="!w-[20%]">

                                        <div className="uploader-complete-badge absolute top-1 ml-5 rounded-lg">
                                            {indicate == true && <div name="badge-success !text-white">
                                                <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                                    <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                                                    <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                                </svg>
                                            </div>}
                                        </div>

                                        {render_image_preview ?
                                            <img src={image} id="file-preview" className='w-[30px] h-[30px] rounded-lg mr-2 bg-cover' />
                                            :
                                            <DocumentText size="16" color="#555555" className='mx-auto' />
                                        }
                                    </div>
                                    <div className="!w-[80%] uploader-filename">
                                        <span className='text-gray-900 text-xs '>{file.name}</span>
                                    </div>
                                </div>

                                <div className='!w-[10%]'>
                                    <p className='text-gray-900 text-sm'> <Trash size="16" className='text-gray-900' onClick={() => { ResetUploader({ emit: true }); }} /> </p>
                                </div>

                            </div>
                        </div>

                    </div>
                )
        }
    }

    return (
        <div className='mt-3 flex-1'>

            <div className="w-[100%] border border-solid h-[60px] bg-white p-1 rounded-md flex justify-center items-center cursor-pointer" >
                <UploaderProcessView />
            </div>

        </div>
    )
}

