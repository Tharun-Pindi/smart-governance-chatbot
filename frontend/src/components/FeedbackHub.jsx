import React from 'react';
import { Star, MessageSquare, CheckCircle2, MapPin, User, Calendar, ImageIcon, HelpCircle } from 'lucide-react';

const FeedbackHub = ({ complaints, userRole, wardNumber, onViewImage }) => {
  // Filter only resolved complaints that have a rating or proof photo
  const feedbacks = complaints.filter(c => 
    (c.status === 'Resolved' || c.status === 'Solved') && 
    (c.rating || c.resolution_media_url)
  );

  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbacks.filter(c => c.rating).length).toFixed(1)
    : "0.0";

  const ratingCounts = feedbacks.reduce((acc, curr) => {
    if (curr.rating) acc[curr.rating] = (acc[curr.rating] || 0) + 1;
    return acc;
  }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Citizens Feedback Hub</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time satisfaction metrics and resolution quality monitoring</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-3 mb-8">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div className="avatar" style={{ background: '#fef3c7', color: '#f59e0b', width: 56, height: 56 }}>
            <Star size={28} fill="#f59e0b" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Average Rating</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{averageRating} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span></h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div className="avatar" style={{ background: '#dcfce7', color: '#16a34a', width: 56, height: 56 }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Resolution Proofs</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{feedbacks.filter(c => c.resolution_media_url).length}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
          <div className="avatar" style={{ background: '#e0f2fe', color: '#0284c7', width: 56, height: 56 }}>
            <MessageSquare size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Feedbacks</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{feedbacks.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-2-1" style={{ gap: '1.5rem' }}>
        {/* Feedback List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Recent Resolution Feedbacks</h3>
          {feedbacks.length > 0 ? (
            feedbacks.map((item) => (
              <div key={item.id} className="card" style={{ padding: '1.25rem' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    {/* Resolution Proof Image */}
                    <div 
                      onClick={() => item.resolution_media_url && onViewImage(item.resolution_media_url)}
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '12px', 
                        background: '#f1f5f9', 
                        overflow: 'hidden', 
                        cursor: item.resolution_media_url ? 'zoom-in' : 'default',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.resolution_media_url ? (
                        <img src={item.resolution_media_url} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={24} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>SG-{item.id.substring(0, 8).toUpperCase()}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={14} /> {item.address?.substring(0, 40) || `Ward ${item.ward}`}
                      </p>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < (item.rating || 0) ? "#f59e0b" : "transparent"} 
                            color={i < (item.rating || 0) ? "#f59e0b" : "#e2e8f0"} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="status-badge status-resolved" style={{ fontSize: '0.7rem' }}>RESOLVED</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Calendar size={12} /> {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <User size={14} color="var(--primary)" />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.citizen_name || 'Anonymous Citizen'}</span>
                   </div>
                   <p style={{ fontSize: '0.875rem', color: '#475569', fontStyle: 'italic' }}>
                      "User provided a {item.rating}-star rating for the resolution quality."
                   </p>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="avatar" style={{ margin: '0 auto 1rem', background: '#f1f5f9' }}>
                <HelpCircle size={24} color="#64748b" />
              </div>
              <h3 style={{ fontWeight: 700 }}>No feedback yet</h3>
              <p style={{ color: 'var(--text-muted)' }}>Feedback will appear here once citizens rate the resolutions.</p>
            </div>
          )}
        </div>

        {/* Rating Breakdown */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Rating Distribution</h3>
          <div className="card" style={{ padding: '1.5rem' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] || 0;
              const percentage = feedbacks.filter(c => c.rating).length > 0 
                ? (count / feedbacks.filter(c => c.rating).length) * 100 
                : 0;
              
              return (
                <div key={star} style={{ marginBottom: '1.25rem' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {star} <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: star >= 4 ? '#22c55e' : star >= 3 ? '#f59e0b' : '#ef4444', 
                        borderRadius: '4px',
                        transition: 'width 1s ease-out'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
               <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Ratings are collected directly from citizens via WhatsApp after a Ward Member submits resolution proof.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackHub;
