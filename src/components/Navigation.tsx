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
    <nav className="bg-blue-800 text-white py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-lg font-bold">StoryVerse</div>
        
        <div className="flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded transition
                ${location.pathname === item.path 
                  ? 'bg-blue-600 font-medium' 
                  : 'hover:bg-blue-700'}`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;