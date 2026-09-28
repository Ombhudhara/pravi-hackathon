import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import useMediaQuery from '../hooks/useMediaQuery';

export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('gov_asset_sidebar_collapsed');
    return saved === 'true';
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('gov_asset_sidebar_collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const toggleCollapse = () => setIsSidebarCollapsed(prev => !prev);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const currentYear = new Date().getFullYear();

  return (
    <div className={`app-shell ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleCollapse={toggleCollapse}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
        isMobile={isMobile}
      />
      
      <div className="app-main-wrapper">
        <Header toggleMobileSidebar={toggleMobileSidebar} />
        
        <main id="main-content" className="app-main-content">
          <Outlet />
        </main>
        
        <footer className="app-footer">
          <div className="app-footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms and Conditions</Link>
          </div>
          <p className="app-footer-copy">
            &copy; {currentYear} PropertyNexus. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
