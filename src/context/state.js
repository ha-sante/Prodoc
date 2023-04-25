import React, { Component, useContext, useState } from 'react';
import { render } from 'react-dom';

const AppContext = React.createContext();

export function AppStateProvider({ children }) {
  const [productContent, setProductContent] = useState([
    { id: "4", title: "Sub Docu Page 4", content: "", children: ["5"] },
    { id: "main1", title: "Main Docu Page 1", content: "", children: ["2", "3", "4"] },
    { id: "2", title: "Sub Docu Page 2", content: "", children: [] },
    { id: "3", title: "Sub Docu Page 3", content: "", children: [] },
    { id: "5", title: "Sub2 Docu Page 5", content: "", children: ['6', '7'] },
    { id: "6", title: "Sub2 Docu Page 6", content: "", children: [] },
    { id: "7", title: "Sub2 Docu Page 7", content: "", children: [] },
  ]);
  const [pagination, setPagination] = useState({});

  const data = { productContent, setProductContent, pagination, setPagination };

  return (
    <AppContext.Provider value={data}> {children} </AppContext.Provider>
  );
};

export const AppStateContext = AppContext;
