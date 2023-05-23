import React, { Component, useContext, useState } from 'react';
import { render } from 'react-dom';
import axios from 'axios';

// DEFAULT DATAS
export const DEFAULT_INITIAL_PAGE_BLOCKS_DATA = {
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
        "text": "<i>This is the description of your page</i>",
        "level": 1
      }
    },
  ]
}
export const DEFAULT_PAGE_DATA = {
  type: "api",
  position: "child",
  title: "",
  description: "",
  content: { editor: "", mdx: "", api: {} },
  children: [],
  configuration: {
    privacy: "public", // or hidden
    purpose: "page", // or external_link
    depricated: false,
    external_link: { url: "" },
    seo: { image: "", title: "", description: "", slug: "" },
  }
}

// REACT CONTEXT STATEMENT MANAGEMENT
const AppContext = React.createContext();
export function AppStateProvider({ children }) {
  const [content, setContent] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState();
  const [configure, setConfigure] = useState(false);
  const [code, setCode] = useState('{ privacy: "public" }');
  const [edited, setEdited] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [permission, setPermission] = useState();
  const [definitions, setDefinitions] = useState(false);
  const [navigation, setNavigation] = useState('main');
  const [builder, setBuilder] = useState({});

  // API CALLS 
  function ContentAPIHandler(option, data) {
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
        return axios.patch(`/api/content`, data);
        break;
    }
  }

  const data = {
    builder, setBuilder,
    navigation, setNavigation,
    definitions, setDefinitions,
    edited, setEdited,
    permission, setPermission,
    code, setCode,
    authenticated, setAuthenticated,
    configure, setConfigure, content, setContent, pagination, setPagination,
    page, setPage, ContentAPIHandler, DEFAULT_INITIAL_PAGE_BLOCKS_DATA, DEFAULT_PAGE_DATA
  };

  return (
    <AppContext.Provider value={data}> {children} </AppContext.Provider>
  );
};
// export const AppStateContext = AppContext;


// API CALLS 
function ContentAPIHandler(option, data) {
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
      return axios.patch(`/api/content`, data);
      break;
  }
}


// JOTAI STATE MANAGEMENT
import { createStore, Provider, useStore } from "jotai";
export const store = createStore(() => ({
  counter: 0,
  content: [],
  pagination: {},
  page: null,
  configure: false,
  code: '{ privacy: "public" }',
  edited: false,
  authenticated: false,
  permission: false,
  definitions: false,
  navigation: 'main',
  builder: {},

  // STATIC DATA & METHODS
  DEFAULT_INITIAL_PAGE_BLOCKS_DATA,
  DEFAULT_PAGE_DATA,
  ContentAPIHandler
}));
export function JotaiAppStateProvider({ children }) {
  return (<Provider store={store}> {children} </Provider>);
};
export const AppStateStoreProvider = JotaiAppStateProvider;


