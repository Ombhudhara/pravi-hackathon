import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNavItemsForRole } from '../config/navigation';
import BrandLogo from './BrandLogo';

export default function Sidebar({ 
  isCollapsed, 
  toggleCollapse, 
  isMobileOpen, 
  closeMobileSidebar,
  isMobile
}) {
  const { user } = useAuth();
  const location = useLocation();
  const drawerRef = useRef(null);

  const navItems = getNavItemsForRole(user?.role);
  const groups = Array.from(new Set(navItems.map(item => item.group).filter(Boolean)));

  useEffect(() => {
    if (isMobile && isMobileOpen) {
      closeMobileSidebar();
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (isMobileOpen && e.key === 'Escape') {
        closeMobileSidebar();
      }
    };
    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, closeMobileSidebar]);

  const renderNavList = () => {
    const itemsWithoutGroup = navItems.filter(item => !item.group);
    
    return (
      <nav className="sidebar-nav">
        <ul>
          {itemsWithoutGroup.map(item => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `sidebar-link ${isActive && item.path !== '/app' ? 'active' : ''} ${isActive && item.path === '/app' && location.pathname === '/app' ? 'active' : ''}`}
                title={isCollapsed && !isMobile ? item.label : undefined}
                end={item.path === '/app'}
                aria-label={item.label}
              >
                <item.icon size={20} className="sidebar-icon" />
                {(!isCollapsed || isMobile) && <span className="sidebar-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
        
        {groups.map(group => (
          <div key={group} className="sidebar-group">
            {(!isCollapsed || isMobile) && <div className="sidebar-group-title">{group}</div>}
            <ul>
              {navItems.filter(item => item.group === group).map(item => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    title={isCollapsed && !isMobile ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <item.icon size={20} className="sidebar-icon" />
                    {(!isCollapsed || isMobile) && <span className="sidebar-label">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    );
  };

  const sidebarContent = (
    <div className={`sidebar ${isCollapsed && !isMobile ? 'collapsed' : ''}`} ref={isMobile ? drawerRef : null}>
      <div className="sidebar-header brand-logo-frame">
        {(!isCollapsed || isMobile) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BrandLogo variant="mark" size="sm" />
            <span className="sidebar-brand" style={{ color: 'var(--color-primary)' }}>PropertyNexus</span>
          </div>
        ) : (
          <BrandLogo variant="mark" size="sm" />
        )}
        {!isMobile && (
          <button className="sidebar-toggle" onClick={toggleCollapse} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>
      <div className="sidebar-scrollable">
        {renderNavList()}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`} onClick={closeMobileSidebar} aria-hidden="true" />
        <div className={`sidebar-drawer ${isMobileOpen ? 'open' : ''}`} tabIndex="-1">
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}
