import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import ThemeToggle from './ThemeToggle';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';

export default function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signupEnabled, logout } = useAuth();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Trap focus and close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const getDashboardPath = () => {
    if (!user) return '/';
    return '/app';
  };

  const navLinks = (
    <>
      <a href="/#what-it-does" className="public-nav-link" onClick={() => setIsMenuOpen(false)}>What it does</a>
      <a href="/#how-it-works" className="public-nav-link" onClick={() => setIsMenuOpen(false)}>How it works</a>
      <a href="/#roles" className="public-nav-link" onClick={() => setIsMenuOpen(false)}>Roles</a>
    </>
  );

  const authButtons = user ? (
    <>
      <Link to={getDashboardPath()} tabIndex={-1}>
        <Button variant="primary" className="w-full-mobile">Go to dashboard</Button>
      </Link>
      <Button variant="ghost" onClick={logout} className="w-full-mobile">Sign out</Button>
    </>
  ) : (
    <>
      <Link to="/login" tabIndex={-1}>
        <Button variant="secondary" className="w-full-mobile">Sign in</Button>
      </Link>
      {signupEnabled && (
        <Link to="/signup" tabIndex={-1}>
          <Button variant="primary" className="w-full-mobile">Create account</Button>
        </Link>
      )}
    </>
  );

  return (
    <header className="public-header" role="banner">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      <div className="public-header-container">
        <Link to="/" className="public-brand-link" aria-label="PropertyNexus Home">
          <BrandLogo />
        </Link>

        {/* Desktop Nav */}
        <nav className="public-nav-desktop" aria-label="Main navigation">
          {navLinks}
        </nav>

        {/* Desktop Actions */}
        <div className="public-actions-desktop">
          <ThemeToggle isCompact={true} />
          {authButtons}
        </div>

        {/* Mobile Toggle */}
        <div className="public-mobile-toggle">
          <ThemeToggle isCompact={true} />
          <button 
            className="mobile-menu-btn" 
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="public-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <nav className="public-mobile-nav">
            {navLinks}
            <div className="public-mobile-auth">
              {authButtons}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
