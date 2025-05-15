import React from 'react';
import { Outlet } from 'react-router-dom';

const AppRouter = () => {
  return (
    <div className="app-container">
      {/* Your app header or navigation would go here */}
      
      {/* This renders the matched child route */}
      <main className="content-container">
        <Outlet />
      </main>
      
      {/* Optional: Footer component */}
    </div>
  );
};

export default AppRouter;
