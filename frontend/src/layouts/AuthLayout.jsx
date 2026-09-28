import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';

export default function AuthLayout() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="auth-layout">
      <div className="auth-header-actions">
        <ThemeToggle isCompact={true} />
      </div>
      <main className="auth-main">
        <Outlet />
      </main>
      <footer className="auth-footer">
        <div className="auth-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms and Conditions</Link>
        </div>
        <p className="auth-footer-copy">
          &copy; {currentYear} PropertyNexus. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
