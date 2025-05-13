// We're not using this component anymore as the navigation is now integrated directly in the App.tsx
// This file is kept as a reference but it's not being used in the application

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBook, FaListUl, FaStream, FaTachometerAlt } from 'react-icons/fa';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/story-worlds', name: 'Story Worlds', icon: <FaBook /> },
    { path: '/series', name: 'Series', icon: <FaStream /> },
    { path: '/stories', name: 'Stories', icon: <FaListUl /> },
  ];

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold">StoryVerse</span>
            </div>
            
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded text-sm font-medium transition-colors duration-150
                      ${location.pathname === item.path 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu - only visible on small screens */}
      <div className="md:hidden border-t border-gray-700">
        <div className="flex justify-between px-2 pt-2 pb-3 space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center px-3 py-2 rounded text-xs font-medium
                ${location.pathname === item.path 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;