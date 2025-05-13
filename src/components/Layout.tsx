// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { useProject } from '../context/ProjectContext';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeProject } = useProject();
  
  return (
    <div className="flex h-screen bg-primary-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <SideNav />
      </div>
      
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
        <header className="bg-white border-b border-primary-200 shadow-sm z-10">
          <div className="flex justify-between items-center py-3 px-6">
            <div className="flex items-center">
              <span className="text-primary-700 mr-2">📚</span>
              <h2 className="text-lg font-medium text-primary-700">{activeProject?.name || 'The Irish Mystery'}</h2>
            </div>
            
            {/* Project Selector and User */}
            <div className="flex items-center">
              <div className="relative mr-4">
                <button className="flex items-center bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-md text-sm">
                  <span>{activeProject?.name || 'The Irish Mystery'}</span>
                  <span className="ml-2">▼</span>
                </button>
              </div>
              
              <button className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
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