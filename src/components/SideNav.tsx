import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const { activeProject } = useProject();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-[#e8e1d9] w-64 min-h-screen p-4 border-r border-[#d6cfc5] hidden md:block">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#654321]">StoryVerse</h1>
        <p className="text-sm text-[#8a7968]">World Builder</p>
      </div>
      
      {/* Active Project */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-[#a69886] font-medium mb-2">ACTIVE PROJECT</h3>
        <div className="relative">
          <button 
            className="w-full p-2 bg-[#d6cfc5] rounded-md text-[#654321] font-medium text-left flex justify-between items-center"
          >
            <span className="truncate">{activeProject?.name || 'Select a Project'}</span>
            <span>▼</span>
          </button>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-[#a69886] font-medium mb-2">MAIN</h3>
        <ul className="space-y-1">
          <li>
            <Link
              to="/"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/') && !isActive('/projects') && !isActive('/samples') && !isActive('/search')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">🏠</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/samples"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/samples')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">📝</span>
              <span>Writing Samples</span>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/search')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">🔍</span>
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Tools */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-[#a69886] font-medium mb-2">TOOLS</h3>
        <ul className="space-y-1">
          <li>
            <Link
              to="/style-analysis"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/style-analysis')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">📊</span>
              <span>Style Analysis</span>
            </Link>
          </li>
          <li>
            <Link
              to="/plot-mapping"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/plot-mapping')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">📈</span>
              <span>Plot Mapping</span>
            </Link>
          </li>
          <li>
            <Link
              to="/consistency-check"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/consistency-check')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">⚡</span>
              <span>Consistency Check</span>
            </Link>
          </li>
          <li>
            <Link
              to="/claude-assistant"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/claude-assistant')
                  ? 'bg-[#d6cfc5] text-[#654321] font-medium'
                  : 'text-[#654321] hover:bg-[#d6cfc5]'
              }`}
            >
              <span className="mr-3">💬</span>
              <span>Claude Assistant</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Settings */}
      <div className="mt-auto">
        <Link
          to="/settings"
          className={`flex items-center p-2 rounded-md transition-colors ${
            isActive('/settings')
              ? 'bg-[#d6cfc5] text-[#654321] font-medium'
              : 'text-[#654321] hover:bg-[#d6cfc5]'
          }`}
        >
          <span className="mr-3">⚙️</span>
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};
