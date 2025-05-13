import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './App.css'

// Ensure root element is properly styled
if (document.getElementById('root')) {
  document.getElementById('root')!.style.cssText = `
    height: 100%;
    width: 100%;
    display: block;
    margin: 0;
    padding: 0;
    overflow: hidden;
  `;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)