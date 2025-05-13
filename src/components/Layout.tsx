// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { useProject } from '../context/ProjectContext';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeProject } = useProject();
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Fixed Sidebar - dark styling */}
      <aside className="bg-neutral-900 text-white w-full md:w-64 md:h-screen md:min-h-screen md:flex-shrink-0 overflow-y-auto">
        <SideNav />
      </aside>
      
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:text-gray-300 focus:outline-none"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-75 md:hidden">
          <div className="w-64 h-full bg-neutral-900">
            <SideNav />
          </div>
          <button
            type="button"
            className="absolute top-0 right-0 p-4 text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Main Content Area - flexes to take remaining space */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header Bar - dark styling */}
        <header className="bg-neutral-900 text-white border-b border-neutral-700 shadow-sm z-10">
          <div className="flex justify-between items-center py-3 px-6">
            <div className="flex items-center">
              <span className="text-white mr-2">📚</span>
              <h2 className="text-lg font-medium text-white">{activeProject?.name || 'The Irish Mystery'}</h2>
            </div>
            
            {/* Project Selector and User */}
            <div className="flex items-center">
              <div className="relative mr-4">
                <button className="flex items-center bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-md text-sm">
                  <span>{activeProject?.name || 'The Irish Mystery'}</span>
                  <span className="ml-2">▼</span>
                </button>
              </div>
              
              <button className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white">
                👤
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content - light beige styling */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-primary-50">
          <div className="max-w-7xl mx-auto py-6 px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}