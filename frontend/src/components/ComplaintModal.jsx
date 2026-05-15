import React, { useState } from 'react';
import { X, MapPin, Tag, Clock, User, MessageSquare, Shield, CheckCircle, Camera } from 'lucide-react';
import MediaRenderer from './MediaRenderer';

const ComplaintModal = ({ complaint, onClose, onUpdateStatus }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [resolutionMedia, setResolutionMedia] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                  onChange={(e) => {
                    if (e.target.value === 'Resolved') {
                      setIsResolving(true);
                    } else {
                      onUpdateStatus(complaint.id, e.target.value);
                    }
                  }}
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

          {isResolving && (
            <div className="resolution-form animate-fade-in" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid #cbd5e1' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>Resolve Complaint</h3>
              
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                Resolution Message (Sent to Citizen)
              </label>
              <textarea 
                value={resolutionMessage}
                onChange={(e) => setResolutionMessage(e.target.value)}
                placeholder="Explain what actions were taken to resolve this issue..."
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', marginBottom: '1rem', minHeight: '100px', outline: 'none' }}
              />

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#475569' }}>
                Proof of Resolution (Optional Photo/Video)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', 
                  background: 'white', border: '1px dashed #cbd5e1', borderRadius: '0.5rem', cursor: 'pointer',
                  fontWeight: 600, color: '#64748b'
                }}>
                  <Camera size={18} />
                  {resolutionMedia ? 'Change Media' : 'Upload Media'}
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setResolutionMedia(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {resolutionMedia && (
                  <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={16} /> Media attached
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    setIsSubmitting(true);
                    await onUpdateStatus(complaint.id, 'Resolved', { message: resolutionMessage, mediaUrl: resolutionMedia });
                    setIsSubmitting(false);
                    setIsResolving(false);
                  }}
                  disabled={isSubmitting}
                  style={{ 
                    padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', borderRadius: '0.5rem', 
                    fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' 
                  }}
                >
                  {isSubmitting ? 'Resolving...' : 'Submit Resolution'}
                </button>
                <button 
                  onClick={() => setIsResolving(false)}
                  disabled={isSubmitting}
                  style={{ 
                    padding: '0.75rem 1.5rem', background: 'transparent', color: '#64748b', borderRadius: '0.5rem', 
                    fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
                <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f8fafc', boxShadow: 'var(--shadow-sm)' }}>
                  <MediaRenderer 
                    url={complaint.media_url} 
                    alt="Evidence" 
                  />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.65rem' }}>
                    Citizen Proof
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', background: '#f1f5f9', borderRadius: '1rem', textAlign: 'center', color: '#64748b', border: '2px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500 }}>No photo uploaded</p>
                </div>
              )}

              {status === 'Resolved' && complaint.resolution_media_url && (
                <div style={{ marginTop: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    Resolution Proof / పరిష్కారం ఫోటో
                  </label>
                  <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #10b981', background: '#ecfdf5', boxShadow: 'var(--shadow-sm)' }}>
                    <MediaRenderer 
                      url={complaint.resolution_media_url} 
                      alt="Resolution Proof" 
                    />
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 'bold' }}>
                      Official Proof
                    </div>
                  </div>
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
