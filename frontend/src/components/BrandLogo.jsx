import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

import logoLight from '../assets/brand/logo-light.png';
import logoDark from '../assets/brand/logo-dark.png';
import markLight512 from '../assets/brand/mark-light-512.png';
import markDark512 from '../assets/brand/mark-dark-512.png';

export default function BrandLogo({ variant = 'full', size = 'md', className = '' }) {
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === 'dark';
  
  let src = '';
  if (variant === 'full') {
    src = isDark ? logoDark : logoLight;
  } else {
    src = isDark ? markDark512 : markLight512;
  }

  // Define dimensions based on variant and size to prevent layout shift
  let width, height;
  if (variant === 'full') {
    switch (size) {
      case 'sm':
        height = 40;
        break;
      case 'lg':
        height = 120;
        break;
      case 'md':
      default:
        height = 80;
        break;
    }
  } else { // mark
    switch (size) {
      case 'sm':
        width = 32;
        height = 32;
        break;
      case 'lg':
        width = 64;
        height = 64;
        break;
      case 'md':
      default:
        width = 48;
        height = 48;
        break;
    }
  }

  return (
    <div className={`brand-logo-frame ${className}`}>
      <img 
        src={src} 
        alt="PropertyNexus" 
        width={width}
        height={height}
        decoding="async"
        style={{ 
          display: 'block', 
          objectFit: 'contain',
          maxWidth: '100%',
          height: height ? `${height}px` : 'auto',
          width: width ? `${width}px` : 'auto'
        }}
      />
    </div>
  );
}
