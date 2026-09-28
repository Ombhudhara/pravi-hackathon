import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Popup, ZoomControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useMapAssets } from '../hooks/useMapAssets';
import AssetMarker from '../components/AssetMarker';
import MapFilters from '../components/MapFilters';
import MapLegend from '../components/MapLegend';
import AssetSummaryCard from '../components/AssetSummaryCard';
import { Filter, List, RefreshCw } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Helper to fit bounds when items change or an asset is selected
function MapController({ items, selectedId }) {
  const map = useMap();

  useEffect(() => {
    if (items.length > 0) {
      if (selectedId) {
        const selected = items.find(a => a.id === selectedId);
        if (selected && selected.latitude && selected.longitude) {
          map.setView([selected.latitude, selected.longitude], 15, { animate: false });
        }
      } else {
        const bounds = L.latLngBounds(items.map(a => [a.latitude, a.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], animate: false });
      }
    }
  }, [items, selectedId, map]);

  return null;
}

export default function MapView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, total, missingCoordinatesCount, truncated, loading, error, refresh } = useMapAssets(searchParams);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isListView, setIsListView] = useState(false);

  const selectedId = searchParams.get('assetId');

  useEffect(() => {
    document.title = 'Map View | PropertyNexus';
  }, []);

  const handleAssetClick = (id) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('assetId', id);
    setSearchParams(newParams);
  };

  const handleClosePopup = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('assetId');
    setSearchParams(newParams);
  };

  const createClusterCustomIcon = function (cluster) {
    return L.divIcon({
      html: `<span>${cluster.getChildCount()}</span>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  };

  // Keyboard trap for drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasCoordinatesFilter = searchParams.toString(); // used to link to list view

  return (
    <div className="map-view-page">
      <div className="map-sidebar">
        <div className="map-sidebar-header">
          <h2 className="text-lg font-semibold">Map View</h2>
          <button className="button button-secondary flex items-center gap-2 lg:hidden" onClick={() => setIsMobileFiltersOpen(true)}>
            <Filter size={16} /> Filters
          </button>
        </div>

        <div className="map-sidebar-filters lg:block hidden">
          <MapFilters />
        </div>

        <div className="map-sidebar-results">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading assets...</div>
          ) : error ? (
            <div className="p-4 text-center text-status-red">
              <p>{error}</p>
              <button className="button button-secondary mt-2 flex items-center gap-2 mx-auto" onClick={refresh}>
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          ) : (
            <div className="results-list">
              <p className="text-xs text-muted mb-2 px-4 pt-2">Showing {items.length} assets with coordinates</p>
              {truncated && <p className="text-xs text-status-amber mb-2 px-4">Results truncated to 5000 items.</p>}
              {missingCoordinatesCount > 0 && (
                <p className="text-xs text-muted mb-4 px-4">
                  <Link to={`/app/assets?hasCoordinates=false&${hasCoordinatesFilter}`} className="text-primary hover:underline">
                    {missingCoordinatesCount} assets are not shown
                  </Link> because they have no coordinates.
                </p>
              )}
              
              {items.length === 0 ? (
                <div className="p-4 text-center text-muted">No assets found with coordinates matching filters.</div>
              ) : (
                <ul className="asset-list-compact">
                  {items.map(asset => (
                    <li 
                      key={asset.id} 
                      className={`asset-list-item ${selectedId === asset.id ? 'selected' : ''}`}
                      onClick={() => handleAssetClick(asset.id)}
                      tabIndex={0}
                      onKeyDown={(e) => { if(e.key === 'Enter') handleAssetClick(asset.id); }}
                    >
                      <div className="font-mono text-xs text-muted">{asset.assetCode}</div>
                      <div className="font-medium text-sm truncate">{asset.name}</div>
                      <div className="text-xs text-muted truncate">{asset.district}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="map-container-wrapper relative">
        <MapContainer 
          center={[20.5937, 78.9629]} // India default
          zoom={5} 
          zoomControl={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution={ATTRIBUTION}
            url={TILE_URL}
          />
          <ZoomControl position="bottomright" />
          <MapController items={items} selectedId={selectedId} />
          
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            disableClusteringAtZoom={16}
            animate={false}
          >
            {items.map(asset => (
              <AssetMarker 
                key={asset.id} 
                asset={asset} 
                isSelected={selectedId === asset.id}
                eventHandlers={{
                  click: () => handleAssetClick(asset.id)
                }}
              />
            ))}
          </MarkerClusterGroup>
          
          {selectedId && items.find(a => a.id === selectedId) && (
            <Popup
              position={[
                items.find(a => a.id === selectedId).latitude,
                items.find(a => a.id === selectedId).longitude
              ]}
              onClose={handleClosePopup}
              closeButton={false}
              autoPan={false}
            >
              <AssetSummaryCard 
                asset={items.find(a => a.id === selectedId)} 
                onClose={handleClosePopup}
              />
            </Popup>
          )}
        </MapContainer>
        
        <div className="map-overlay-bottom-left absolute bottom-4 left-4 z-[1000] pointer-events-none">
          <div className="pointer-events-auto">
            <MapLegend />
          </div>
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div className="modal-backdrop z-[2000]" onClick={() => setIsMobileFiltersOpen(false)}>
          <div className="modal-content filter-drawer-mobile" onClick={e => e.stopPropagation()}>
            <MapFilters isOpen={isMobileFiltersOpen} onClose={() => setIsMobileFiltersOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
