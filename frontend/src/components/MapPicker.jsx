import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const customIcon = L.divIcon({
  html: `<div style="color: var(--color-primary); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
  className: 'picker-marker-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition(pos.lat, pos.lng);
        }
      }}
    />
  );
}

export default function MapPicker({ latitude, longitude, onLocationSelect }) {
  const [pos, setPos] = useState(latitude && longitude ? { lat: latitude, lng: longitude } : null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (latitude && longitude) {
      setPos({ lat: latitude, lng: longitude });
      if (mapRef.current) {
        mapRef.current.flyTo([latitude, longitude], 15, { animate: false });
      }
    } else {
      setPos(null);
    }
  }, [latitude, longitude]);

  const handleSetPosition = (lat, lng) => {
    onLocationSelect(lat, lng);
  };

  const handleClear = () => {
    onLocationSelect(null, null);
  };

  const center = pos ? [pos.lat, pos.lng] : [20.5937, 78.9629]; // default India
  const zoom = pos ? 15 : 5;

  return (
    <div className="map-picker-wrapper">
      <div className="map-picker-container" style={{ height: '300px', width: '100%', position: 'relative', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <MapContainer 
          center={center} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          ref={mapRef}
        >
          <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
          <LocationMarker position={pos} setPosition={handleSetPosition} />
        </MapContainer>
        {pos && (
          <button 
            type="button" 
            className="button button-secondary absolute top-2 right-2 z-[1000] flex items-center gap-1 shadow-sm bg-surface"
            onClick={handleClear}
            style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
          >
            <X size={14} /> Clear location
          </button>
        )}
      </div>
      <p className="text-xs text-muted mt-2">Click or drag the marker to set coordinates on the map.</p>
    </div>
  );
}
