// ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode 
      ? {
          background: '#121212',
          cardBackground: '#1E1E1E',
          text: '#FFFFFF',
          secondaryText: '#BBBBBB',
          border: '#333333',
          primary: '#70ae70',
          icon: '#FFFFFF',
        }
      : {
          background: '#F2F2F2',
          cardBackground: '#FFFFFF',
          text: '#000000',
          secondaryText: '#555555',
          border: '#DDDDDD',
          primary: '#70ae70',
          icon: '#000000',
        }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);