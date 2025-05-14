import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTheaterMasks, 
  FaEdit, 
  FaHistory, 
  FaExchangeAlt, 
  FaComments, 
  FaFileImport, 
  FaFileExport 
} from 'react-icons/fa';

const SceneNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { 
      path: '/scenes', 
      exact: true,
      icon: <FaTheaterMasks />, 
      label: 'Scene Explorer' 
    },
    { 
      path: '/scenes/edit', 
      icon: <FaEdit />, 
      label: 'Scene Editor' 
    },
    { 
      path: '/scenes/versions', 
      icon: <FaHistory />, 
      label: 'Version History' 
    },
    { 
      path: '/scenes/compare', 
      icon: <FaExchangeAlt />, 
      label: 'Compare Versions' 
    },
    { 
      path: '/scenes/comments', 
      icon: <FaComments />, 
      label: 'Comments' 
    },
    { 
      path: '/scenes/import', 
      icon: <FaFileImport />, 
      label: 'Import' 
    },
    { 
      path: '/scenes/export', 
      icon: <FaFileExport />, 
      label: 'Export' 
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  };

  return (
    <div className="scene-nav" style={{
      display: 'flex',
      backgroundColor: '#f5f5f5',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      marginBottom: '1.5rem'
    }}>
      {navItems.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            marginRight: '0.5rem',
            color: isActive(item.path, item.exact) ? '#fff' : '#333',
            backgroundColor: isActive(item.path, item.exact) ? '#3b82f6' : 'transparent',
            textDecoration: 'none',
            transition: 'background-color 0.2s, color 0.2s'
          }}
        >
          <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default SceneNav;