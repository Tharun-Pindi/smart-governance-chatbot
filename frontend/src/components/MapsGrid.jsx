import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapsGrid = ({ complaints, onSelectComplaint, view = 'both' }) => {
  const defaultCenter = [17.3850, 78.4867]; // Hyderabad

  const markers = complaints
    .filter(c => typeof c.location === 'string' && c.location.includes(','))
    .map(c => {
      try {
        const parts = c.location.split(',').map(p => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return { id: c.id, lat: parts[0], lng: parts[1], title: c.title, category: c.category };
        }
      } catch (e) {
        console.error("Error parsing location:", c.location, e);
      }
      return null;
    })
    .filter(m => m !== null);

  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter;

  const showLive = view === 'both' || view === 'live';
  const showHeatmap = view === 'both' || view === 'heatmap';

  return (
    <div className={`grid ${view === 'both' ? 'grid-2' : 'grid-1'} mb-6 animate-fade-in`} style={{ width: '100%' }}>
      {/* Live Map */}
      {showLive && (
        <div className="card">
          <h3 className="mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>Live Complaints Map</h3>
          <div className="map-container">
            <MapContainer key={`map-${center[0]}-${center[1]}`} center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {markers.map(m => (
                <Marker 
                  key={m.id} 
                  position={[m.lat, m.lng]}
                  eventHandlers={{
                    click: () => onSelectComplaint(complaints.find(c => c.id === m.id))
                  }}
                >
                  <Popup>
                    <strong>{m.title}</strong><br />
                    {m.category}<br />
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '10px', padding: '2px 8px', marginTop: '5px' }}
                      onClick={() => onSelectComplaint(complaints.find(c => c.id === m.id))}
                    >
                      View Full Details
                    </button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            <div style={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              zIndex: 1000, 
              background: 'white', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.75rem'
            }}>
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }}></div>
                <span>Water Issue</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></div>
                <span>Road Issue</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div>
                <span>Garbage</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Placeholder */}
      {showHeatmap && (
        <div className="card">
          <h3 className="mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>Complaints Heatmap (Density View)</h3>
          <div className="map-container">
            <MapContainer key={`heat-${center[0]}-${center[1]}`} center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* For a real heatmap, we'd use Leaflet.heat, but for now we'll show circles as density */}
              {markers.map(m => (
                <CircleMarker 
                  key={m.id} 
                  center={[m.lat, m.lng]} 
                  radius={20} 
                  pathOptions={{ fillColor: 'red', color: 'transparent', fillOpacity: 0.2 }} 
                  eventHandlers={{
                    click: () => onSelectComplaint(complaints.find(c => c.id === m.id))
                  }}
                />
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapsGrid;
