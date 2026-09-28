import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Lightbox({ isOpen, onClose, images, currentIndex, onIndexChange, title }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        onIndexChange(Math.max(0, currentIndex - 1));
      }
      if (e.key === 'ArrowRight') {
        onIndexChange(Math.min(images.length - 1, currentIndex + 1));
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      overlayRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, currentIndex, images.length, onIndexChange]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      className="lightbox-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Image lightbox"
      tabIndex={-1}
      ref={overlayRef}
    >
      <div className="lightbox-header">
        <div className="lightbox-title">
          {title || `Image ${currentIndex + 1} of ${images.length}`}
        </div>
        <button className="lightbox-close" onClick={onClose} aria-label="Close lightbox">
          <X size={24} />
        </button>
      </div>
      
      <div className="lightbox-content">
        {currentIndex > 0 && (
          <button 
            className="lightbox-nav prev" 
            onClick={() => onIndexChange(currentIndex - 1)}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <img 
          src={currentImage.url} 
          alt={currentImage.alt || `Image ${currentIndex + 1} of ${images.length}`} 
          className="lightbox-img"
        />
        
        {currentIndex < images.length - 1 && (
          <button 
            className="lightbox-nav next" 
            onClick={() => onIndexChange(currentIndex + 1)}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
