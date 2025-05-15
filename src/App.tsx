import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <div className="App">
      <Layout />
    </div>
  );
}

export default App;
