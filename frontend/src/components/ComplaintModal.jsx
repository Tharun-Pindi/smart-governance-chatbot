import React from 'react';
import { X, MapPin, Tag, Clock, User, MessageSquare, Shield, CheckCircle } from 'lucide-react';

const ComplaintModal = ({ complaint, onClose, onUpdateStatus }) => {
  if (!complaint) return null;

  const statusColors = {
    'Pending': { bg: '#fef3c7', text: '#92400e', icon: Clock },
    'In Progress': { bg: '#e0e7ff', text: '#3730a3', icon: Shield },
    'Resolved': { bg: '#d1fae5', text: '#065f46', icon: CheckCircle }
  };

  const status = complaint.status || 'Pending';
  const color = statusColors[status] || statusColors['Pending'];

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem'
    }}>
      <div className="modal-content card animate-fade-in" onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '0'
      }}>
        <div style={{ padding: '2rem', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            background: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10
          }}>
            <X size={20} />
          </button>
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="status-badge" style={{ background: color.bg, color: color.text }}>
                  {status}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  ID: SG-{String(complaint.id || '').substring(0, 8).toUpperCase()}
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{complaint.title || 'No Title'}</h2>
            </div>
            
            <div className="flex gap-2">
              {status === 'Resolved' ? (
                <div style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: '#d1fae5',
                  color: '#065f46',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid #10b981'
                }}>
                  <CheckCircle size={16} />
                  Problem Resolved
                </div>
              ) : (
                <select 
                  value={status} 
                  onChange={(e) => onUpdateStatus(complaint.id, e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="Pending">Mark Pending</option>
                  <option value="In Progress">Set In Progress</option>
                  <option value="Resolved">Mark Resolved</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-2 gap-8 mb-8">
            <div className="detail-item">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Description
              </label>
              <p style={{ lineHeight: '1.6', color: 'var(--text-main)', marginBottom: '1.5rem' }}>{complaint.description}</p>
              
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Media Evidence / అప్‌లోడ్ చేసిన ఫోటో
              </label>
              {complaint.media_url ? (
                <a href={complaint.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', cursor: 'zoom-in' }}>
                  <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f8fafc', boxShadow: 'var(--shadow-sm)' }}>
                    <img 
                      src={complaint.media_url} 
                      alt="Evidence" 
                      style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.65rem' }}>
                      Click to expand
                    </div>
                  </div>
                </a>
              ) : (
                <div style={{ padding: '2rem', background: '#f1f5f9', borderRadius: '1rem', textAlign: 'center', color: '#64748b', border: '2px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500 }}>No photo uploaded</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} color="var(--primary)" style={{ marginTop: '3px' }} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Location</label>
                  <p style={{ fontSize: '0.875rem' }}>{complaint.address || complaint.location || 'Unknown'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag size={18} color="var(--warning)" style={{ marginTop: '3px' }} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
                  <p style={{ fontSize: '0.875rem' }}>{complaint.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={18} color="var(--success)" style={{ marginTop: '3px' }} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Citizen Name</label>
                  <p style={{ fontSize: '0.875rem' }}>{complaint.citizen_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={18} color="#6366f1" style={{ marginTop: '3px' }} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Ward No</label>
                  <p style={{ fontSize: '0.875rem' }}>{complaint.ward || 'General'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare size={18} color="#64748b" style={{ marginTop: '3px' }} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Phone / ID</label>
                  <p style={{ fontSize: '0.875rem' }}>{complaint.citizen_id}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={onClose}>
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;
