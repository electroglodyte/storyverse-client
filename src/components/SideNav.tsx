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
    <nav className="bg-primary-100 w-64 h-screen overflow-y-auto py-4 border-r border-primary-200">
      {/* Logo and Subtitle */}
      <div className="px-4 mb-8">
        <h1 className="text-2xl font-bold text-primary-700">StoryVerse</h1>
        <p className="text-sm text-primary-600">World Builder</p>
      </div>
      
      {/* Active Project */}
      <div className="px-4 mb-6">
        <h3 className="text-xs uppercase text-primary-500 font-medium mb-2">ACTIVE PROJECT</h3>
        <div className="relative">
          <button 
            className="w-full p-2 bg-primary-50 rounded-md text-primary-700 font-medium text-left flex justify-between items-center"
          >
            <span className="truncate">{activeProject?.name || 'Select a Project'}</span>
            <svg className="h-4 w-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="mb-6">
        <h3 className="px-4 text-xs uppercase text-primary-500 font-medium mb-2">MAIN</h3>
        <ul>
          <li>
            <Link
              to="/"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/') && !isActive('/projects') && !isActive('/samples') && !isActive('/search')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/samples"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/samples')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span>Writing Samples</span>
            </Link>
          </li>
          <li>
            <Link
              to="/search"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/search')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Tools */}
      <div className="mb-6">
        <h3 className="px-4 text-xs uppercase text-primary-500 font-medium mb-2">TOOLS</h3>
        <ul>
          <li>
            <Link
              to="/style-analysis"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/style-analysis')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span>Style Analysis</span>
            </Link>
          </li>
          <li>
            <Link
              to="/plot-mapping"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/plot-mapping')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Plot Mapping</span>
            </Link>
          </li>
          <li>
            <Link
              to="/consistency-check"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/consistency-check')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Consistency Check</span>
            </Link>
          </li>
          <li>
            <Link
              to="/claude-assistant"
              className={`flex items-center px-4 py-2 transition-colors ${
                isActive('/claude-assistant')
                  ? 'bg-primary-200 text-primary-700 font-medium'
                  : 'text-primary-700 hover:bg-primary-200'
              }`}
            >
              <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>Claude Assistant</span>
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Settings */}
      <div className="px-4 mt-auto pt-6">
        <Link
          to="/settings"
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            isActive('/settings')
              ? 'bg-primary-200 text-primary-700 font-medium'
              : 'text-primary-700 hover:bg-primary-200'
          }`}
        >
          <svg className="mr-3 h-5 w-5 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};