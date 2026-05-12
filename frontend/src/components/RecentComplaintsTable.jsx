import React from 'react';
import { Eye, Edit2, MessageCircle, ChevronRight } from 'lucide-react';

const RecentComplaintsTable = ({ complaints, onSelectComplaint, onViewAll, onViewImage, userRole, wardNumber }) => {
  return (
    <div className="card animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
          {userRole === 'ward_admin' ? `Recent Complaints in Ward ${wardNumber}` : 'Recent Complaints'}
        </h3>
        <button 
          className="btn-premium" 
          onClick={onViewAll}
        >
          View All Complaints
          <ChevronRight size={18} />
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="recent-complaints-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Media</th>
              <th>Category</th>
              <th>Location</th>
              <th>Ward</th>
              <th>Status</th>
              <th>Citizen Name</th>
              <th>Reported By</th>
              <th>Date & Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.slice(0, 3).map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>SG-{String(c.id || '').substring(0, 8).toUpperCase()}</td>
                <td>
                  {c.media_url ? (
                    <div 
                      style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'zoom-in' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewImage(c.media_url);
                      }}
                    >
                      <img src={c.media_url} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <MessageCircle size={14} />
                    </div>
                  )}
                </td>
                <td>{c.category}</td>
                <td>{c.address || c.location || 'N/A'}</td>
                <td>
                  {(() => {
                    const match = c.address?.match(/Ward\s*(\d+)/i) || c.description?.match(/Ward\s*(\d+)/i);
                    return c.ward || (match ? `Ward ${match[1]}` : 'General');
                  })()}
                </td>
                <td>
                  <span className={`status-badge status-${c.status.toLowerCase().replace(' ', '')}`}>
                    {c.status}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{c.citizen_name || 'N/A'}</td>
                <td>{c.citizen_id || 'Anonymous'}</td>
                <td>{new Date(c.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td>
                  <div className="flex gap-3">
                    <button 
                      className="action-btn-modern view" 
                      onClick={() => onSelectComplaint(c)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentComplaintsTable;
