import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Could not start the app: no #root element was found in index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <CssBaseline />
    <App />
  </StrictMode>,
);
