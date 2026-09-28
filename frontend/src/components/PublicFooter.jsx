import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const orgName = import.meta.env.VITE_ORG_NAME;
  const orgEmail = import.meta.env.VITE_ORG_CONTACT_EMAIL;

  return (
    <footer className="public-footer" role="contentinfo">
      <div className="public-footer-content">
        <div className="public-footer-brand">
          <BrandLogo />
        </div>
        
        <div className="public-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms and Conditions</Link>
          {orgEmail && (
            <a href={`mailto:${orgEmail}`}>Contact</a>
          )}
        </div>
        
        <p className="public-footer-copy">
          &copy; {currentYear} {orgName || 'PropertyNexus'}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
