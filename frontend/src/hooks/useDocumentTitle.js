import { useEffect } from 'react';
import { findNavItemByPath } from '../config/navigation';
import { useLocation } from 'react-router-dom';

const PRODUCT_NAME = 'PropertyNexus';

export default function useDocumentTitle(customTitle) {
  const location = useLocation();

  useEffect(() => {
    if (customTitle) {
      document.title = `${customTitle} | ${PRODUCT_NAME}`;
      return;
    }

    // Special cases
    if (location.pathname === '/app/account') {
      document.title = `Account | ${PRODUCT_NAME}`;
      return;
    }
    
    const navItem = findNavItemByPath(location.pathname);
    if (navItem) {
      // Handle dynamic route titles
      if (location.pathname.match(/^\/app\/assets\/[^/]+$/)) {
        document.title = `Asset Details | ${PRODUCT_NAME}`;
      } else {
        document.title = `${navItem.label} | ${PRODUCT_NAME}`;
      }
    } else {
      document.title = PRODUCT_NAME;
    }
  }, [location.pathname, customTitle]);
}
