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
    <nav className="bg-primary-200 w-64 h-screen overflow-y-auto p-4 border-r border-primary-300">
      {/* Logo and Subtitle */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-700">StoryVerse</h1>
        <p className="text-sm text-primary-600">World Builder</p>
      </div>
      
      {/* Active Project */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-primary-500 font-medium mb-2">ACTIVE PROJECT</h3>
        <div className="relative">
          <button 
            className="w-full p-2 bg-primary-300 rounded-md text-primary-700 font-medium text-left flex justify-between items-center"
          >
            <span className="truncate">{activeProject?.name || 'Select a Project'}</span>
            <span>▼</span>
          </button>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="mb-6">
        <h3 className="text-xs uppercase text-primary-500 font-medium mb-2">MAIN</h3>
        <ul className="space-y-1">
          <li>
            <Link
              to="/"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/') && !isActive('/projects') && !isActive('/samples') && !isActive('/search')
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
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
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
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
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
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
        <h3 className="text-xs uppercase text-primary-500 font-medium mb-2">TOOLS</h3>
        <ul className="space-y-1">
          <li>
            <Link
              to="/style-analysis"
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive('/style-analysis')
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
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
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
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
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
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
                  ? 'bg-primary-300 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-300'
              }`}
            >
              <span className="mr-3">💬</span>
              <span>Claude Assistant</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Settings */}
      <div className="mt-auto pt-6">
        <Link
          to="/settings"
          className={`flex items-center p-2 rounded-md transition-colors ${
            isActive('/settings')
              ? 'bg-primary-300 text-primary-700 font-medium'
              : 'text-primary-700 hover:bg-primary-300'
          }`}
        >
          <span className="mr-3">⚙️</span>
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};