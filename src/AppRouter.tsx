import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './components/Navigation'; // Import your navigation component if you have one

const AppRouter = () => {
  return (
    <div className="app-container">
      {/* Your app header or navigation here */}
      <Navigation />
      
      {/* This renders the matched child route */}
      <main className="content-container">
        <Outlet />
      </main>
      
      {/* Optional: Footer component */}
    </div>
  );
};

export default AppRouter;
