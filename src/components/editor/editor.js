import React, { useEffect, useRef, useContext, useState } from "react";
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

import {
  store, contentAtom, pageAtom, pageIdAtom, logger, EditorPageBlocksHandler
} from '../../context/state';
import { useStore, useAtom, useSetAtom, useAtomValue } from "jotai";


export default function PageEditor(props) {
  const ejInstance = useRef();
  const isReady = useRef(false);

  const [page, setPage] = useAtom(pageAtom);
  const paidId = useAtomValue(pageIdAtom);
  const [editor, setEditor] = useState("")

  const initEditor = () => {
    logger.log("initEditor.called");
    const editor = new EditorJS({
      holder: 'editorjs',
      onReady: () => {
        ejInstance.current = editor;
      },
      autofocus: false,
      data: page !== undefined ? page?.content?.editor : EditorPageBlocksHandler("This is the title of your page", "This is the description of your page"),
      onChange: async () => {
        let output = await editor.saver.save();
        console.log("editor.save.output", output);
        props.EditorOutputHandler(output);
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
                logger.log("supposed.to.upload.file", fileData);

                // fileData must be `Blob`, `File`, `Buffer`, UUID, CDN URL or Remote URL
                const result = await uploadFile(fileData, {
                  publicKey: process.env.NEXT_PUBLIC_EDITOR_UPLOADCARE_PUBLIC_KEY,
                  store: 'auto',
                  metadata: {
                    subsystem: 'uploader',
                    pet: 'cat'
                  }
                })
                logger.log(`URL: ${result.cdnUrl}`)

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
    if (page != null) {
      logger.log("editorjs.page.refreshed", { ejInstance });

      if (ejInstance.current == null) {
        // logger.log("editorjs.current.instance == null");
        initEditor();
      }

      return () => {
        ejInstance?.current?.destroy();
        ejInstance.current = null;
      };
    }
  }, [paidId]);



  return <><div id='editorjs'></div></>;
}
