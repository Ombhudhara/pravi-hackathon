import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, ChevronDown } from 'lucide-react';
import Badge from './Badge';
import ThemeToggle from './ThemeToggle';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleAccount = () => {
    setIsOpen(false);
    navigate('/app/account');
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-menu-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="user-info">
          <span className="user-name">{user?.full_name}</span>
          <Badge variant={user?.role === 'ADMIN' ? 'amber' : 'neutral'}>{user?.role}</Badge>
        </div>
        <ChevronDown size={16} className="user-menu-icon" />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown" role="menu">
          <button role="menuitem" onClick={handleAccount}>
            <User size={16} /> Account
          </button>
          <div className="dropdown-divider"></div>
          <ThemeToggle />
          <div className="dropdown-divider"></div>
          <button role="menuitem" onClick={handleSignOut} className="text-danger">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
