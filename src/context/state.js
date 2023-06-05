import React, { Component, useContext, useState } from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import localForage from 'localforage';
const loglevel = require("loglevel");

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

export function EditorPageBlocksHandler(title, description) {
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
}

export function NewPageHandler(navigation, position, title, description) {
  console.log({ navigation, position, title, description })
  let new_page = {}
  switch (navigation) {
    case "product":
      new_page = {
        type: "product", position, title, description,
        content: { editor: EditorPageBlocksHandler(title, description), mdx: "", api: {} },
        children: [],
        configuration: PAGE_CONFIGURATION
      };
      return (new_page);
      break;
    case "api":
      new_page = {
        type: "api", position, title, description,
        content: { editor: EditorPageBlocksHandler(title, description), mdx: "", api: {} },
        children: [],
        configuration: PAGE_CONFIGURATION
      };
      return (new_page);
      break;
    case "walkthroughs":
      new_page = {
        type: "walkthroughs", position, title, description,
        content: { editor: EditorPageBlocksHandler(title, description), mdx: "", api: {} },
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
      return axios({
        method: 'PATCH',
        url: '/api/content',
        data: data,
        timeout: 300000 // 5 minutes in milliseconds
      })
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


