import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navigation from './components/Navigation';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="pb-12">
        <Outlet />
      </main>
      
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#166534',
            },
          },
          error: {
            style: {
              background: '#991b1b',
            },
          },
        }}
      />
    </div>
  );
}

export default App;