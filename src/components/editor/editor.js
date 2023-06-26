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

import { DocumentUpload, CloudAdd, CloudPlus } from 'iconsax-react';

import Components from './tools/components'

import {
  store, contentAtom, pageAtom, pageIdAtom, logger, EditorPageBlocksHandler, StorageAPIHandler
} from '../../context/state';
import { useStore, useAtom, useSetAtom, useAtomValue } from "jotai";


export default function PageEditor(props) {
  const ejInstance = useRef();
  const [page, setPage] = useAtom(pageAtom);
  const pageId = useAtomValue(pageIdAtom);

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

                // UPLOAD THE FILE
                const blob = new Blob([fileData], { type: fileData.type });
                let url = await StorageAPIHandler(blob, blob?.name, null);
                logger.log(`URL: ${url}`)

                // RETURN THE URL OF THE UPLOADED FILE
                return {
                  success: 1,
                  file: {
                    url: url,
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
  }, [pageId]);



  return <><div id='editorjs'></div></>;
}
