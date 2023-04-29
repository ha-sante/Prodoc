import React, { Component, useContext, useState } from 'react';
import { render } from 'react-dom';
import axios from 'axios';

const AppContext = React.createContext();

export function AppStateProvider({ children }) {
  const [content, setContent] = useState([
    // { id: "4", title: "Sub Docu Page 4", content: "", children: ["5"] },
    // { id: "main1", title: "Main Docu Page 1", content: "", children: [] },
    // { id: "2", title: "Sub Docu Page 2", content: "", children: [] },
    // { id: "3", title: "Sub Docu Page 3", content: "", children: [] },
    // { id: "5", title: "Sub2 Docu Page 5", content: "", children: ['6', '7'] },
    // { id: "6", title: "Sub2 Docu Page 6", content: "", children: [] },
    // { id: "7", title: "Sub2 Docu Page 7", content: "", children: [] },
  ]);
  const [pagination, setPagination] = useState({});
  const DEFAULT_INITIAL_PAGE_BLOCKS_DATA = {
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
    }
  }

  const data = { content, setContent, pagination, setPagination, ContentAPIHandler, DEFAULT_INITIAL_PAGE_BLOCKS_DATA };
  return (
    <AppContext.Provider value={data}> {children} </AppContext.Provider>
  );
};

export const AppStateContext = AppContext;
