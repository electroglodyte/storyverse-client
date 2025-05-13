import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

export const SideNav: React.FC = () => {
  const location = useLocation();
  const { activeProject } = useProject();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/samples', label: 'Writing Samples', icon: '📝' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-gray-800 w-64 min-h-screen p-4 hidden md:block">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-400">StoryVerse</h1>
        {activeProject && (
          <div className="mt-2 p-2 bg-gray-700 rounded-md">
            <span className="text-xs text-gray-400">Active Project:</span>
            <p className="text-white font-medium truncate">{activeProject.name}</p>
          </div>
        )}
      </div>
      
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center p-2 rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="mt-8 border-t border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Links</h3>
        <ul className="space-y-1">
          <li>
            <Link
              to="/samples/new"
              className="text-gray-300 hover:text-white text-sm flex items-center"
            >
              <span className="mr-2">➕</span>
              <span>Add New Sample</span>
            </Link>
          </li>
          <li>
            <Link
              to="/projects/new"
              className="text-gray-300 hover:text-white text-sm flex items-center"
            >
              <span className="mr-2">➕</span>
              <span>Create New Project</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};
