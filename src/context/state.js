import React, { Component, useContext, useState } from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import localForage from 'localforage';
const loglevel = require("loglevel");

import Output from 'editorjs-react-renderer';
import StringToReactComponent from 'string-to-react-component';
import Highlight from 'react-highlight'
import slugify from '@sindresorhus/slugify';

// loglevel.config({
//   development: {
//     "level": "debug"
//   },
//   production: {
//     "level": "error"
//   }
// });

export const logger = loglevel;

// DEFAULT DATAS
export const DEFAULT_INITIAL_PAGE_BLOCKS_DATA = {
  "time": new Date().getTime(),
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "Page Title here",
        "level": 1
      }
    },
    {
      "type": "paragraph",
      "data": {
        "text": "<i>Page Description here</i>",
        "level": 1
      }
    },
  ]
}

const PAGE_CONFIGURATION = {
  privacy: "public", // or hidden
  purpose: "page", // or external_link
  depricated: false,
  external_link: { url: "" },
  seo: { image: "", title: "", description: "", slug: "" },
};

export const DEFAULT_PAGE_DATA = {
  type: "api",
  position: "child",
  title: "",
  description: "",
  content: { editor: "", mdx: "", api: {} },
  children: [],
  configuration: PAGE_CONFIGURATION
}

// FUNCTIONS
export function EditorPageBlocksHandler(title, description, navigation) {
  if (navigation != "walkthroughs") {
    return ({
      "time": new Date().getTime(),
      "blocks": [
        {
          "type": "header",
          "data": {
            "text": title,
            "level": 1
          }
        },
        {
          "type": "paragraph",
          "data": {
            "text": `<i>${description}</i>`,
            "level": 1
          }
        },
      ]
    })
  } else {
    return ({});
  }
}

export function SluggifyPageTitle(title, content) {
  let slugged = slugify(title);
  let copies = content.filter(page => page.slug == slugged);
  if (copies.length > 0) {
    slugged += `-${copies.length + 1}`;
  }

  return slugged;
}

export function NewPageHandler(navigation, position, title, description) {
  console.log({ navigation, position, title, description })
  let new_page = {}
  switch (navigation) {
    case "product":
      new_page = {
        type: "product", position, title, description,
        content: { editor: EditorPageBlocksHandler(title, description, navigation), mdx: "", api: {} },
        children: [],
        configuration: PAGE_CONFIGURATION
      };
      return (new_page);
      break;
    case "api":
      new_page = {
        type: "api", position, title, description,
        content: { editor: EditorPageBlocksHandler(title, description, navigation), mdx: "", api: {} },
        children: [],
        configuration: PAGE_CONFIGURATION
      };
      return (new_page);
      break;
    case "walkthroughs":
      new_page = {
        type: "walkthroughs", position, title, description,
        content: { editor: EditorPageBlocksHandler(title, description, navigation), mdx: "", api: {} },
        children: [],
        configuration: PAGE_CONFIGURATION,
        // WALKTHROUGH SPECIFIC
        logo: "",
        category: ""
      };
      return (new_page);
      break;
    default:
      return new_page;
  }

}

export const StorageHandler = {
  set: (name, value) => {
    return typeof window !== undefined && localForage.setItem(name, value);
  },
  get: (name) => {
    return typeof window !== undefined && localForage.getItem(name);
  }
}

const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

function niceBytes(x) {

  let l = 0, n = parseInt(x, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

export function roughSizeOfObject(object) {
  const objectList = [];
  const stack = [object];
  const bytes = [0];
  while (stack.length) {
    const value = stack.pop();
    if (value == null) bytes[0] += 4;
    else if (typeof value === 'boolean') bytes[0] += 4;
    else if (typeof value === 'string') bytes[0] += value.length * 2;
    else if (typeof value === 'number') bytes[0] += 8;
    else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);
      if (typeof value.byteLength === 'number') bytes[0] += value.byteLength;
      else if (value[Symbol.iterator]) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of value) stack.push(v);
      } else {
        Object.keys(value).forEach(k => {
          bytes[0] += k.length * 2; stack.push(value[k]);
        });
      }
    }
  }
  return niceBytes(bytes[0]);
}


export function EditorPageContentRenderer(content) {

  // All valid JSX inline styles are allowed
  const style = {
    header: {
      h1: {
        border: "1px solid black",
        margin: "20px"
      },
      h2: {
        border: "1px solid black",
        margin: "20px"
      },
    },
    paragraph: {
      fontSize: '16px',
    }
  };

  const classes = {
    header: {
      h1: "mb-40 text-lg font-medium",
      h2: "mb-40 text-lg font-bold",
    },
    paragraph: '',
  };

  const config = {
    header: {
      disableDefaultStyle: false,
    },
    image: {
      disableDefaultStyle: false,
    },
    video: {
      disableDefaultStyle: false,
    },
  };


  // REACT COMPONENTS CUSTOM RENDERED
  const ComponentsRenderer = ({ data, style, classNames, config }) => {
    console.log("components.data", { data, style, classNames, config });

    return (
      <StringToReactComponent>
        {`()=>{data}`}
      </StringToReactComponent>
    )
  };

  const CodeSectionRenderer = ({ data, style, classNames, config }) => {
    console.log("components.data", { data, style, classNames, config })

    return (
      <div className='editor-codebox-area'>
        <Highlight className='python overflow-scroll text-xs p-2 !rounded-sm [&>pre]:rounded-sm'>
          {data.code}
        </Highlight>
      </div>
    );
  };


  // CUSTOM RENDERERS FOR BLOCKS
  const renderers = {
    components: ComponentsRenderer,
    code: CodeSectionRenderer,
  };

  // RENDERED
  return (<Output renderers={renderers} data={content} classNames={classes} config={config} />);
}


// API CALLS 
export function ContentAPIHandler(option, data) {
  switch (option) {
    case 'POST':
      return axios.post('/api/content', data);
      break;
    case 'GET':
      return axios.get('/api/content');
      break;
    case 'PUT':
      return axios.put('/api/content', data);
      break;
    case 'DELETE':
      return axios.delete(`/api/content?id=${data.id}`);
      break;
    case 'PATCH':

      // let body_size = roughSizeOfObject(data);
      // let configuration_object = roughSizeOfObject(data?.configuration);
      // console.log("api.content.patch.called.diagnostics.body_size", body_size);
      // console.log("api.content.patch.called.diagnostics.configuration_object", configuration_object);

      return axios({
        method: 'PATCH',
        url: '/api/content',
        data: data,
        // timeout: 180, // 30 minutes in seconds
        // // headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        // maxContentLength: 100000000,
        // maxBodyLength: 1000000000
      })
      break;
  }
}

export function ConfigAPIHandler(option, data) {
  switch (option) {
    case 'GET':
      return axios.get('/api/config');
      break;
    case 'PUT':
      return axios.put('/api/config', data);
      break;
  }
}

// JOTAI STATE MANAGEMENT
import { createStore, Provider, useStore, atom, useAtom } from "jotai";
export const store = createStore();

// - ATOMS
export const contentAtom = atom([]);

export const paginationAtom = atom({});
export const pageAtom = atom({});
export const builderAtom = atom({});
export const configurationAtom = atom({ readme: "", });

export const configureAtom = atom(false);
export const editedAtom = atom(false);
export const authenticatedAtom = atom(false);
export const permissionAtom = atom(false);
export const definitionsAtom = atom(false);

export const codeAtom = atom('');
export const navigationAtom = atom('main');

export const pageIdAtom = atom('');
export const serverAtom = atom('');

// - STATIC DATA & METHODS
export function JotaiAppStateProvider({ children }) {
  return (<Provider store={store}>{children}</Provider>);
};
export const AppStateStoreProvider = JotaiAppStateProvider;


