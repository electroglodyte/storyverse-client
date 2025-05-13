// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SideNav } from './SideNav';
import { useProject } from '../context/ProjectContext';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeProject } = useProject();
  
  return (
    <div className="flex h-screen bg-primary-50">
      {/* Desktop Sidebar - this should be visible at md breakpoint and above */}
      <SideNav />
      
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-primary-700 hover:text-primary-600 focus:outline-none"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-primary-50 bg-opacity-75 md:hidden">
          <div className="w-64 h-full">
            <SideNav />
          </div>
          <button
            type="button"
            className="absolute top-0 right-0 p-4 text-primary-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="bg-primary-200 border-b border-primary-300 shadow-sm z-10">
          <div className="flex justify-between items-center py-3 px-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-primary-700 rounded-sm mr-2"></div>
              <h2 className="text-lg font-medium text-primary-700">{activeProject?.name || 'StoryVerse'}</h2>
            </div>
            
            {/* Project Selector and User */}
            <div className="flex items-center">
              <div className="relative mr-4">
                <button className="flex items-center bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-md text-sm">
                  <span>{activeProject?.name || 'Select Project'}</span>
                  <span className="ml-2">▼</span>
                </button>
              </div>
              
              <button className="w-8 h-8 rounded-full bg-primary-300 flex items-center justify-center text-primary-700">
                👤
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}