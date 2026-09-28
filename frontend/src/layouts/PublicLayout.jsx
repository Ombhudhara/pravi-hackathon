import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function PublicLayout() {
  return (
    <div className="app-layout">
      <PublicHeader />
      <main id="main-content" className="public-main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
