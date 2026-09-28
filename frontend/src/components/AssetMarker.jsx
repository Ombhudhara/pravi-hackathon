import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Status encoded by color and shape
const getIconSvg = (status, isSelected) => {
  let color = 'var(--color-primary)';
  let shape = 'circle';
  
  switch(status) {
    case 'ACTIVE': color = 'var(--color-status-green)'; shape = 'circle'; break;
    case 'VACANT': color = 'var(--color-status-amber)'; shape = 'square'; break;
    case 'UNDER_MAINTENANCE': color = 'var(--color-status-red)'; shape = 'diamond'; break;
    case 'AVAILABLE': color = 'var(--color-status-teal)'; shape = 'ring'; break;
    case 'RETIRED':
    case 'TRANSFERRED':
    case 'DISPOSED': color = 'var(--color-text-disabled)'; shape = 'circle'; break;
    default: color = 'var(--color-text-disabled)'; shape = 'circle'; break;
  }

  const strokeWidth = isSelected ? 4 : 2;
  const strokeColor = isSelected ? 'var(--color-text-main)' : 'var(--color-surface)';
  const size = isSelected ? 24 : 16;
  const half = size / 2;

  let pathOrShape = '';
  if (shape === 'circle') {
    pathOrShape = `<circle cx="${half}" cy="${half}" r="${half - strokeWidth/2}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
  } else if (shape === 'square') {
    pathOrShape = `<rect x="${strokeWidth/2}" y="${strokeWidth/2}" width="${size - strokeWidth}" height="${size - strokeWidth}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
  } else if (shape === 'diamond') {
    pathOrShape = `<polygon points="${half},${strokeWidth/2} ${size - strokeWidth/2},${half} ${half},${size - strokeWidth/2} ${strokeWidth/2},${half}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
  } else if (shape === 'ring') {
    pathOrShape = `<circle cx="${half}" cy="${half}" r="${half - strokeWidth}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
                   <circle cx="${half}" cy="${half}" r="${half - strokeWidth/2}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth/2}" />`;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${pathOrShape}
    </svg>
  `;
};

export default function AssetMarker({ asset, isSelected, eventHandlers }) {
  const iconHtml = getIconSvg(asset.status, isSelected);
  
  const icon = L.divIcon({
    html: iconHtml,
    className: 'custom-asset-marker',
    iconSize: isSelected ? [24, 24] : [16, 16],
    iconAnchor: isSelected ? [12, 12] : [8, 8],
    popupAnchor: [0, isSelected ? -12 : -8]
  });

  return (
    <Marker 
      position={[asset.latitude, asset.longitude]} 
      icon={icon} 
      eventHandlers={eventHandlers}
      title={`${asset.assetCode} - ${asset.name}`}
      alt={`${asset.assetCode} - ${asset.name}`}
      keyboard={true}
    />
  );
}
