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
    <nav className="w-full h-full py-4">
      {/* Logo and Subtitle */}
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold text-amber-100">StoryVerse</h1>
        <p className="text-sm text-amber-200/80">World Builder</p>
      </div>
      
      {/* Active Project */}
      <div className="px-6 mb-6">
        <h3 className="text-xs uppercase text-amber-300/70 font-medium mb-2">ACTIVE PROJECT</h3>
        <div className="relative">
          <button 
            className="w-full p-2 bg-neutral-800 rounded-md text-white font-medium text-left flex justify-between items-center"
          >
            <span className="truncate">{activeProject?.name || 'The Irish Mystery'}</span>
            <span>▼</span>
          </button>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="mb-6">
        <h3 className="px-6 text-xs uppercase text-amber-300/70 font-medium mb-2">MAIN</h3>
        <ul>
          <li>
            <Link
              to="/"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/') && !isActive('/projects') && !isActive('/samples') && !isActive('/search')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">🏠</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/samples"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/samples')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">📝</span>
              <span>Writing Samples</span>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/search')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">🔍</span>
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Tools */}
      <div className="mb-6">
        <h3 className="px-6 text-xs uppercase text-amber-300/70 font-medium mb-2">TOOLS</h3>
        <ul>
          <li>
            <Link
              to="/style-analysis"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/style-analysis')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">📊</span>
              <span>Style Analysis</span>
            </Link>
          </li>
          <li>
            <Link
              to="/plot-mapping"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/plot-mapping')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">📈</span>
              <span>Plot Mapping</span>
            </Link>
          </li>
          <li>
            <Link
              to="/consistency-check"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/consistency-check')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">⚡</span>
              <span>Consistency Check</span>
            </Link>
          </li>
          <li>
            <Link
              to="/claude-assistant"
              className={`flex items-center px-6 py-2 text-white transition-colors ${
                isActive('/claude-assistant')
                  ? 'bg-neutral-800 font-medium'
                  : 'hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2">💬</span>
              <span>Claude Assistant</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Settings */}
      <div className="mt-auto pt-4 px-6">
        <Link
          to="/settings"
          className={`flex items-center px-6 py-2 text-white transition-colors ${
            isActive('/settings')
              ? 'bg-neutral-800 font-medium'
              : 'hover:bg-neutral-800'
          }`}
        >
          <span className="mr-2">⚙️</span>
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};