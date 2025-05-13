// src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { useProject } from '../context/ProjectContext';

export default function Layout() {
  // Removed unused mobileMenuOpen state
  const { activeProject } = useProject();
  
  // Direct styling with !important to override any conflicts
  const layoutStyles = `
    .layout-container {
      display: flex !important;
      flex-direction: row !important;
      height: 100vh !important;
      width: 100% !important;
      overflow: hidden !important;
    }
    
    .sidebar {
      width: 260px !important;
      min-width: 260px !important;
      height: 100vh !important;
      background-color: #1f2024 !important;
      color: white !important;
      overflow-y: auto !important;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1) !important;
      z-index: 10 !important;
    }
    
    .main-content {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      min-width: 0 !important;
      height: 100vh !important;
      overflow: hidden !important;
    }
    
    .header {
      background-color: #1f2024 !important;
      color: white !important;
      padding: 1rem !important;
      border-bottom: 1px solid #3a3b41 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    
    .content-area {
      flex: 1 !important;
      background-color: #f8f5f0 !important;
      overflow-y: auto !important;
      padding: 1.5rem !important;
    }
    
    @media (max-width: 768px) {
      .layout-container {
        flex-direction: column !important;
      }
      
      .sidebar {
        width: 100% !important;
        height: auto !important;
      }
    }
  `;
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: layoutStyles }} />
      <div className="layout-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <SideNav />
        </aside>
        
        {/* Main Content Area */}
        <div className="main-content">
          {/* Header */}
          <header className="header">
            <div className="flex items-center">
              <span className="mr-2">📚</span>
              <h2 className="text-lg font-medium">{activeProject?.name || 'The Irish Mystery'}</h2>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4">
                <button style={{ backgroundColor: '#2d2e33', padding: '0.375rem 0.75rem', borderRadius: '0.375rem' }}>
                  <span>{activeProject?.name || 'The Irish Mystery'}</span>
                  <span className="ml-2">▼</span>
                </button>
              </div>
              
              <button style={{ width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: '#2d2e33', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                👤
              </button>
            </div>
          </header>
          
          {/* Content Area */}
          <main className="content-area">
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}