import React, { useCallback, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileDropzone({ onDrop, accept, maxSize, maxFiles, multiple = true, label = "Drop files here" }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [onDrop]);

  const handleChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      // Reset so same file can be selected again if removed
      e.target.value = null;
    }
  }, [onDrop]);

  const processFiles = (files) => {
    const validFiles = files.filter(f => f.size <= maxSize);
    const invalidSizeCount = files.length - validFiles.length;
    
    if (invalidSizeCount > 0) {
      alert(`${invalidSizeCount} file(s) exceeded the maximum size limit of ${Math.round(maxSize / 1024 / 1024)}MB and were skipped.`);
    }

    if (validFiles.length > 0) {
      onDrop(multiple ? validFiles : [validFiles[0]]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className={`file-dropzone ${isDragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept={accept} 
        multiple={multiple} 
        style={{ display: 'none' }} 
      />
      <div className="file-dropzone-icon">
        <UploadCloud size={32} />
      </div>
      <div className="file-dropzone-text">{label}</div>
      <div className="file-dropzone-hint">
        Supported formats: {accept.replace(/\./g, '').split(',').join(', ').toUpperCase()} (Max {Math.round(maxSize / 1024 / 1024)}MB per file)
      </div>
    </div>
  );
}
