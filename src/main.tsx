// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from './amplify-config'; // Ensure this points to your config file

// Configure Amplify before rendering the app
Amplify.configure(amplifyConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);