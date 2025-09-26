// src/services/NetworkProvider.js
import React from 'react';
import NetworkErrorBoundary from '../components/NetworkErrorBoundary'; // Your component from previous code

const NetworkProvider = ({ children }) => {
  return (
    <NetworkErrorBoundary>
      {children}
    </NetworkErrorBoundary>
  );
};

export default NetworkProvider;