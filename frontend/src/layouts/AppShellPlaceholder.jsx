import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LogOut, User, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Badge from '../components/Badge';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';

export default function AppShellPlaceholder() {
  const { user, logout } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="app-layout">
      <header className="public-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/app" className="public-header-brand" aria-label="PropertyNexus Home">
            <BrandLogo variant="full" size="sm" />
          </Link>
          
          <nav className="public-header-nav">
            {user?.role === 'ADMIN' && (
              <Link to="/app/users" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={16} /> Users
              </Link>
            )}
            <Link to="/app/account" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={16} /> Account
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle isCompact={true} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              {user?.full_name}
            </span>
            <Badge variant={user?.role === 'ADMIN' ? 'amber' : 'neutral'}>
              {user?.role}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} icon={<LogOut size={16} />}>
            Sign out
          </Button>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="public-footer">
        <div className="public-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms and Conditions</Link>
        </div>
        <p className="public-footer-copy">
          &copy; {currentYear} PropertyNexus. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
