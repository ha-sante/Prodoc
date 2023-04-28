import React, { useEffect, useRef } from "react";
import dynamic from 'next/dynamic';

import EditorJS from "@editorjs/editorjs";

import Embed from '@editorjs/embed'
import Table from '@editorjs/table'
import Paragraph from '@editorjs/paragraph'
import List from '@editorjs/list'
import Warning from '@editorjs/warning'
import Code from '@editorjs/code'
import LinkTool from '@editorjs/link'
import Image from '@editorjs/image'
import Raw from '@editorjs/raw'
import Header from '@editorjs/header'
import Quote from '@editorjs/quote'
import Marker from '@editorjs/marker'
import CheckList from '@editorjs/checklist'
import Delimiter from '@editorjs/delimiter'
import InlineCode from '@editorjs/inline-code'
import SimpleImage from '@editorjs/simple-image'


import { uploadFile } from '@uploadcare/upload-client'
import { DocumentUpload, CloudAdd, CloudPlus } from 'iconsax-react';

import AdvancedComponents from './components/components'

const DEFAULT_INITIAL_DATA = {
  "time": new Date().getTime(),
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "This is the Title of your page!",
        "level": 1
      }
    },
    {
      "type": "paragraph",
      "data": {
        "text": "This is the description of your page",
        "level": 1
      }
    },
  ]
}

class SimpleImage2 {
  static get toolbox() {
    return {
      title: 'Image',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
    };
  }

  render() {
    return document.createElement('input');
  }

  save(blockContent) {
    return {
      url: blockContent.value
    }
  }
}

const EditorComponent = () => {
  const ejInstance = useRef();

  const initEditor = () => {
    const editor = new EditorJS({
      holder: 'editorjs',
      onReady: () => {
        ejInstance.current = editor;
      },
      autofocus: false,
      data: DEFAULT_INITIAL_DATA,
      onChange: async () => {
        let content = await editor.saver.save();

        console.log(content);
      },
      tools: {
        header: {
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 1
          },
        },
        table: Table,
        list: List,
        linkTool: LinkTool,
        checklist: CheckList,
        image: {
          class: Image,
          config: {
            uploader: {
              async uploadByFile(fileData) {
                console.log("supposed.to.upload.file", fileData);

                // fileData must be `Blob`, `File`, `Buffer`, UUID, CDN URL or Remote URL
                const result = await uploadFile(fileData, {
                  publicKey: process.env.NEXT_PUBLIC_EDITOR_UPLOADCARE_PUBLIC_KEY,
                  store: 'auto',
                  metadata: {
                    subsystem: 'uploader',
                    pet: 'cat'
                  }
                })
                console.log(`URL: ${result.cdnUrl}`)


                // Return the url to the uploaded file
                return {
                  success: 1,
                  file: {
                    url: result.cdnUrl,
                    // any other image data you want to store, such as width, height, color, extension, etc
                  }
                }
              },
            }
          }
        },
        embed: Embed,
        code: Code,
        inlineCode: InlineCode,
        simpleImage: SimpleImage,
        warning: Warning,
        raw: Raw,
        quote: Quote,
        marker: Marker,
        delimiter: Delimiter,
        components: {
          class: AdvancedComponents,
          config: {
            placeholder: 'Edit component data'
          }
        }
      },
    });
  };

  // This will run only once
  useEffect(() => {
    if (ejInstance.current === null) {
      initEditor();
    }

    return () => {
      ejInstance?.current?.destroy();
      ejInstance.current = null;
    };
  }, []);

  return <><div id='editorjs'></div></>;
}

export default EditorComponent;