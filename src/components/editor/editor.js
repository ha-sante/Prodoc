import React, { useEffect, useRef, useContext } from "react";
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

import Components from './tools/components'
import { AppStateContext } from '../../context/state';

// export default function EditorSidebar() {
export default function EditorComponent(props){
  let ejInstance = useRef();
  const AppState = useContext(AppStateContext);

  const initEditor = () => {
    console.log("page.editor.refreshed");
    const editor = new EditorJS({
      holder: 'editorjs',
      onReady: () => {
        ejInstance.current = editor;
      },
      autofocus: false,
      data: AppState.page !== undefined ? AppState.page?.content?.editor : AppState.DEFAULT_INITIAL_PAGE_BLOCKS_DATA,
      onChange: async () => {
        let output = await editor.saver.save();
        props.onSave(output, output.blocks[0]?.data?.text, output.blocks[1]?.data?.text);
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
          class: Components,
        }
      },
    });
  };

  // This will run only once
  useEffect(() => {
    // console.log("editorjs.page.refreshed", { ejInstance });

    if (ejInstance.current == null) {
      // console.log("editorjs.current.instance == null");
      initEditor();
    }

    return () => {
      ejInstance?.current?.destroy();
      ejInstance.current = null;
    };
  }, [AppState.page]);

  return <><div id='editorjs'></div></>;
}
