import React, { createContext, useContext, useState } from 'react';

const AppStateContext = createContext();

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
  const [isPickingDocument, setIsPickingDocument] = useState(false);

  return (
    <AppStateContext.Provider value={{ isPickingDocument, setIsPickingDocument }}>
      {children}
    </AppStateContext.Provider>
  );
};