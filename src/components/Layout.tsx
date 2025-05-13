// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SideNav } from './SideNav';
import { useProject } from '../context/ProjectContext';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeProject } = useProject();
  const location = useLocation();

  // Function to get page title based on current URL
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/samples')) return 'Writing Samples';
    if (path.startsWith('/style-analysis')) return 'Style Analysis';
    if (path.startsWith('/plot-mapping')) return 'Plot Mapping';
    if (path.startsWith('/consistency-check')) return 'Consistency Check';
    if (path.startsWith('/claude-assistant')) return 'Claude Assistant';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/search')) return 'Search';
    return 'StoryVerse';
  };

  return (
    <div className="flex h-screen bg-[#f4f1ec]">
      {/* Desktop Sidebar */}
      <SideNav />
      
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#654321] hover:text-[#8a7968] focus:outline-none"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-10 bg-[#f4f1ec] bg-opacity-75">
          <div className="w-64 h-full">
            <SideNav />
          </div>
          <button
            type="button"
            className="absolute top-0 right-0 p-4 text-[#654321]"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="bg-[#e8e1d9] border-b border-[#d6cfc5] shadow-sm z-10">
          <div className="flex justify-between items-center py-3 px-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-[#654321] rounded-sm mr-2"></div>
              <h2 className="text-lg font-medium text-[#654321]">{activeProject?.name || 'StoryVerse'}</h2>
            </div>
            
            {/* Project Selector and User */}
            <div className="flex items-center">
              <div className="relative mr-4">
                <button className="flex items-center bg-[#d6cfc5] hover:bg-[#c9c0b4] text-[#654321] px-3 py-1.5 rounded-md text-sm">
                  <span>{activeProject?.name || 'Select Project'}</span>
                  <span className="ml-2">▼</span>
                </button>
              </div>
              
              <button className="w-8 h-8 rounded-full bg-[#d6cfc5] flex items-center justify-center text-[#654321]">
                👤
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 px-6">
            <h1 className="text-2xl font-bold text-[#654321] mb-6">{getPageTitle()}</h1>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}