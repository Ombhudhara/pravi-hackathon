import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { findNavItemByPath } from '../config/navigation';

export default function Breadcrumbs() {
  const location = useLocation();
  const { assetId } = useParams(); // If we are on /app/assets/:assetId

  const paths = location.pathname.split('/').filter(p => p);
  
  if (paths.length <= 1) return null; // e.g. just /app, no breadcrumb needed typically, but we will render Dashboard

  const navItem = findNavItemByPath(location.pathname);
  
  const crumbs = [];

  // Base crumb
  crumbs.push({ label: 'Dashboard', path: '/app', isLink: true });

  if (location.pathname === '/app/account') {
    crumbs.push({ label: 'Account', path: '/app/account', isLink: false });
  } else if (navItem && navItem.path !== '/app') {
    const isExact = navItem.path === location.pathname;
    crumbs.push({ label: navItem.label, path: navItem.path, isLink: !isExact });
    
    // Check if it's a detail page like /app/assets/:assetId
    if (!isExact && location.pathname.startsWith('/app/assets/') && assetId) {
      crumbs.push({ label: assetId, path: location.pathname, isLink: false });
    }
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} aria-current={isLast ? 'page' : undefined}>
              {crumb.isLink && !isLast ? (
                <Link to={crumb.path}>{crumb.label}</Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {!isLast && <ChevronRight size={14} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
