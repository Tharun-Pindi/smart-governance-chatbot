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

const WARD_CENTERS = {
  '1': [17.0005, 81.7700],
  '2': [17.0010, 81.7750],
  '3': [17.0020, 81.7800],
  '4': [17.0030, 81.7850],
  '5': [17.0040, 81.7900],
  '6': [17.0067, 81.7847], 
  '7': [17.0100, 81.7900],
  '8': [17.0150, 81.7950],
  '9': [17.0200, 81.8000],
  '10': [17.0250, 81.8050],
  '11': [17.0280, 81.8080],
  '12': [17.0310, 81.8110],
  '13': [17.0340, 81.8140],
  '14': [17.0370, 81.8170],
  '15': [17.0400, 81.8200],
};

const FlyToMarkers = ({ markers, wardNumber, defaultCenter }) => {
  const map = useMap();
  const prevWardRef = React.useRef(null);
  
  React.useEffect(() => {
    // Basic recalculation to prevent gray tiles on resize/remount
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Prevent map from "snapping back" when user pans/zooms or data polls
    if (prevWardRef.current === wardNumber && map.getZoom() !== undefined) {
      return; 
    }
    prevWardRef.current = wardNumber;

    if (markers && markers.length > 0) {
      const validMarkers = markers.filter(m => m.lat !== 0 && m.lng !== 0);
      if (validMarkers.length === 1) {
        // If only one pin, just set the view directly to a moderate zoom (13) to avoid heavy zooming
        map.setView([validMarkers[0].lat, validMarkers[0].lng], 13, { animate: false });
      } else if (validMarkers.length > 1) {
        // If multiple pins, fit them in view, but restrict maxZoom to 13 to avoid heavy zooming
        const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13, animate: false });
      }
    } else {
      // Instantly go to ward center, no flying, moderate zoom
      const target = wardNumber 
        ? (WARD_CENTERS[wardNumber] || [17.01 + (parseInt(wardNumber) * 0.001), 81.78 + (parseInt(wardNumber) * 0.001)]) 
        : defaultCenter;
      
      map.setView(target, wardNumber ? 13 : 7, { animate: false });
    }
  }, [markers, map, wardNumber, defaultCenter]);
  
  return null;
};





const MapsGrid = ({ complaints, onSelectComplaint, selectedComplaint, view = 'both', userRole, wardNumber }) => {
  const defaultCenter = [17.2, 80.1]; // Regional view covering Hyderabad to Rajahmundry

  // --- Robust Coordinate Parsing ---
  const markers = complaints
    .map(c => {
      let lat = null, lng = null;
      
      // 1. Try to parse from location string "lat,lng"
      if (typeof c.location === 'string' && c.location.includes(',')) {
        try {
          const parts = c.location.split(',').map(p => parseFloat(p.trim()));
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            lat = parts[0];
            lng = parts[1];
          }
        } catch (e) {
          console.error("Error parsing location:", c.location, e);
        }
      }

      // 2. Fallback to ward center if location is missing or invalid
      if (lat === null || lng === null) {
        const rawWard = c.ward ? String(c.ward).replace(/\D/g, '') : null;
        if (rawWard && rawWard.length > 0) {
          const fallback = WARD_CENTERS[rawWard] || [17.01 + (parseInt(rawWard) * 0.001), 81.78 + (parseInt(rawWard) * 0.001)];
          lat = fallback[0];
          lng = fallback[1];
        } else {
          return null; // Skip markers without location or ward
        }
      }

      // Final check to prevent NaN
      if (isNaN(lat) || isNaN(lng)) return null;

      return { 
        id: c.id, 
        lat, 
        lng, 
        title: c.title || c.category || 'Untitled Report', 
        category: c.category || 'Other',
        status: c.status || 'Pending',
        priority: c.priority || 'Medium'
      };
    })
    .filter(m => m !== null);

  // --- Safe Center Calculation ---
  const getSafeCenter = () => {
    if (markers.length > 0) return [markers[0].lat, markers[0].lng];
    
    const cleanWard = wardNumber ? String(wardNumber).replace(/\D/g, '') : '';
    if (cleanWard && WARD_CENTERS[cleanWard]) return WARD_CENTERS[cleanWard];
    
    if (cleanWard) {
        const val = parseInt(cleanWard);
        if (!isNaN(val)) return [17.01 + (val * 0.001), 81.78 + (val * 0.001)];
    }
    
    return defaultCenter;
  };

  const center = getSafeCenter();

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
    
    return L.divIcon({
      className: `custom-marker-icon ${isUrgent ? 'marker-pin-urgent' : ''}`,
      html: `
        <div class="custom-marker-container" style="display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 32px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); transform: translateY(-10px);">📍</div>
          ${isUrgent ? '<div class="marker-pulse-ring" style="top: 15px; width: 30px; height: 30px;"></div>' : ''}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 35],
      popupAnchor: [0, -35]
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
            <MapContainer 
              center={center} 
              zoom={wardNumber ? 14 : 6} 
              maxZoom={19} 
              style={{ height: '350px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FlyToLocation complaint={selectedComplaint} />
              <FlyToMarkers markers={markers} wardNumber={wardNumber} defaultCenter={defaultCenter} />
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
            <MapContainer 
              center={center} 
              zoom={wardNumber ? 14 : 6} 
              maxZoom={19} 
              style={{ height: '350px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FlyToLocation complaint={selectedComplaint} />
              <FlyToMarkers markers={markers} wardNumber={wardNumber} defaultCenter={defaultCenter} />
              {/* For a real heatmap, we'd use Leaflet.heat, but for now we'll show circles as density */}
              {markers.map(m => (
                <CircleMarker 
                  key={`heat-${m.id}`} 
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
