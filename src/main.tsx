import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Routes from './routes';

// Remove console logs in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Routes />
  </React.StrictMode>,
);