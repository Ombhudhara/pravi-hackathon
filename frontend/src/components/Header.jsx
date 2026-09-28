import React from 'react';
import { Menu } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import UserMenu from './UserMenu';

export default function Header({ toggleMobileSidebar }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="app-header-breadcrumbs">
          <Breadcrumbs />
        </div>
      </div>
      
      <div className="app-header-right">
        <UserMenu />
      </div>
    </header>
  );
}
