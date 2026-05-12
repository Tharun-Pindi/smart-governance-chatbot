import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Eye } from 'lucide-react';


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

const FlyToLocation = ({ complaint }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (complaint && complaint.location) {
      const parts = complaint.location.split(',').map(p => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        map.flyTo([parts[0], parts[1]], 18, { 
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [complaint, map]);
  
  return null;
};



const MapsGrid = ({ complaints, onSelectComplaint, selectedComplaint, view = 'both', userRole, wardNumber }) => {
  const defaultCenter = [17.2, 80.1]; // Regional view covering Hyderabad to Rajahmundry

  const markers = complaints
    .filter(c => typeof c.location === 'string' && c.location.includes(','))
    .map(c => {
      try {
        const parts = c.location.split(',').map(p => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return { 
            id: c.id, 
            lat: parts[0], 
            lng: parts[1], 
            title: c.title || c.category || 'Untitled Report', 
            category: c.category || 'Other',
            status: c.status || 'Pending',
            priority: c.priority || 'Medium'
          };
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

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];
  const uniqueCategories = Array.from(new Set(markers.map(m => m.category || 'Other')));
  const categoryColors = uniqueCategories.reduce((acc, cat, idx) => {
    acc[cat] = COLORS[idx % COLORS.length];
    return acc;
  }, {});

  const createCustomIcon = (color, priority, status) => {
    const isUrgent = priority === 'Urgent' || priority === 'High';
    const isPending = status === 'Pending';
    
    return L.divIcon({
      className: `custom-marker-icon ${isUrgent ? 'marker-pin-urgent' : ''}`,
      html: `
        <div class="custom-marker-container">
          <div class="marker-pin-outer" style="background-color: ${color};">
            <div class="marker-pin-inner"></div>
          </div>
          <div class="marker-shadow"></div>
          ${isUrgent ? '<div class="marker-pulse-ring"></div>' : ''}
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -36]
    });
  };

  return (
    <div className={`grid ${view === 'both' ? 'grid-2' : 'grid-1'} mb-6 animate-fade-in`} style={{ width: '100%' }}>
      {/* Live Map */}
      {showLive && (
        <div className="card">
          <h3 className="mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>
            {userRole === 'ward_admin' ? `Ward Map (Ward ${wardNumber})` : 'Live Complaints Map'}
          </h3>
          <div className="map-container">
            <MapContainer key="fixed-live-map" center={defaultCenter} zoom={6} maxZoom={19} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FlyToLocation complaint={selectedComplaint} />
              {markers.map(m => (
                <Marker 
                  key={m.id} 
                  position={[m.lat, m.lng]}
                  icon={createCustomIcon(categoryColors[m.category] || '#3b82f6', m.priority, m.status)}
                  eventHandlers={{
                    click: () => onSelectComplaint(complaints.find(c => c.id === m.id))
                  }}
                >
                  <Popup className="custom-popup">
                    <div style={{ padding: '4px' }}>
                      <div className="flex justify-between items-center mb-2" style={{ gap: '10px' }}>
                        <span className={`status-badge status-${(m.status || 'pending').toLowerCase().replace(/\s+/g, '')}`} style={{ fontSize: '10px' }}>
                          {m.status}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: m.priority === 'Urgent' ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {m.priority}
                        </span>
                      </div>
                      <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{m.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Category: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.category}</span>
                      </div>
                      <button 
                        className="btn-premium" 
                        style={{ width: '100%', fontSize: '11px', padding: '6px 12px', borderRadius: '8px' }}
                        onClick={() => onSelectComplaint(complaints.find(c => c.id === m.id))}
                      >
                        <Eye size={14} />
                        View Full Details
                      </button>
                    </div>
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
              {uniqueCategories.map(cat => (
                <div key={cat} className="flex items-center gap-2 mb-1" style={{ marginBottom: '4px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: categoryColors[cat] }}></div>
                  <span style={{ fontSize: '0.75rem' }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Placeholder */}
      {showHeatmap && (
        <div className="card">
          <h3 className="mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>Complaints Heatmap (Density View)</h3>
          <div className="map-container">
            <MapContainer key="fixed-heat-map" center={defaultCenter} zoom={6} maxZoom={19} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FlyToLocation complaint={selectedComplaint} />
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
