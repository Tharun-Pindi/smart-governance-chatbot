import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  Cpu, 
  Globe, 
  Shield, 
  Bot, 
  Bell, 
  Maximize2,
  RefreshCw,
  Server,
  Database,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

const Settings = ({ userProfile, setUserProfile }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [localProfile, setLocalProfile] = useState(userProfile);
  const [performanceData, setPerformanceData] = useState(Array(20).fill(30));
  const [systemLoad, setSystemLoad] = useState(42);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setLocalProfile(userProfile);
    }
  }, [userProfile]);

  const handleProfileSave = () => {
    if (localProfile) {
      setUserProfile(localProfile);
      showToast("Profile Updated Globally!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalProfile(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name') {
        const initials = value.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join('').toUpperCase().substring(0, 2);
        updated.avatar = initials || 'AD';
      }
      return updated;
    });
  };

  // Initialize settings from localStorage or defaults
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('gov_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return {
      aiCore: true,
      geoRouting: true,
      intrusionShield: true,
      enhancedAudit: false,
      citizenBroadcast: true,
      aggression: 50
    };
  });

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('gov_settings', JSON.stringify(config));
    console.log("Settings Persisted:", config);
  }, [config]);

  // Dynamic Performance Data Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceData(prev => {
        const newData = [...prev.slice(1), Math.floor(Math.random() * 60) + 20];
        return newData;
      });
      // System load is influenced by active services
      const serviceCount = Object.values(config).filter(v => v === true).length;
      setSystemLoad(Math.floor(Math.random() * 10) + (serviceCount * 8));
    }, 2000);
    return () => clearInterval(interval);
  }, [config]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSetting = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    showToast(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} is now ${value ? 'ACTIVE' : 'DISABLED'}`);
  };

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast("Cloud Database Synchronized", 'success');
    }, 1500);
  };

  return (
    <div className="dynamic-settings-cockpit animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Dynamic Bar - REACTS TO CONFIG */}
      <div className="dynamic-status-bar">
        <div className="status-group">
          <div className={`pulse-icon ${config.aiCore ? 'active' : 'inactive'}`}>
            <Activity size={16} />
          </div>
          <span>AI ENGINE: <strong style={{ color: config.aiCore ? '#22c55e' : '#ef4444' }}>{config.aiCore ? 'ONLINE' : 'OFFLINE'}</strong></span>
        </div>
        <div className="status-group">
          <Server size={16} />
          <span>SERVICES: <strong>{Object.values(config).filter(v => v === true).length} / 5</strong></span>
        </div>
        <div className="status-group">
          <Shield size={16} color={config.intrusionShield ? '#22c55e' : '#64748b'} />
          <span>SHIELD: <strong>{config.intrusionShield ? 'ARMED' : 'DISARMED'}</strong></span>
        </div>
        <button className={`sync-btn ${isSyncing ? 'spinning' : ''}`} onClick={triggerSync}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="cockpit-grid">
        {/* Visual Performance Monitoring */}
        <div className="cockpit-card performance-visual">
          <div className="card-header">
            <Zap size={18} color="var(--primary)" />
            <h3>Real-time Throughput</h3>
            <span className="load-tag">{config.aiCore ? systemLoad : 0}% LOAD</span>
          </div>
          <div className="chart-container">
            {performanceData.map((val, i) => (
              <div 
                key={i} 
                className="chart-bar" 
                style={{ 
                  height: `${config.aiCore ? val : 0}%`, 
                  opacity: (i + 1) / performanceData.length,
                  background: val > 70 ? 'var(--danger)' : 'var(--primary)',
                  transition: 'height 0.8s ease'
                }}
              ></div>
            ))}
          </div>
          <div className="chart-labels">
            <span>{config.aiCore ? '-60s' : 'No Data'}</span>
            <span>{config.aiCore ? 'Now' : ''}</span>
          </div>
          {!config.aiCore && (
            <div className="ai-offline-overlay">
              <Bot size={32} />
              <p>AI Engine Offline - Analysis Paused</p>
            </div>
          )}
        </div>

        {/* Dynamic Controls */}
        <div className="cockpit-card settings-controls">
          <div className="tabs-minimal">
            <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
            <button className={activeTab === 'performance' ? 'active' : ''} onClick={() => setActiveTab('performance')}>Engine</button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>Security</button>
            <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>Global</button>
            <button className={activeTab === 'whatsapp' ? 'active' : ''} onClick={() => setActiveTab('whatsapp')}>WhatsApp</button>
          </div>

          <div className="tab-content-dynamic">
            {activeTab === 'profile' && (
              <div className="profile-settings-form fade-in">
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>
                  <div className="avatar-large" style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    background: localProfile?.photo ? `url(${localProfile.photo}) center/cover` : 'linear-gradient(135deg, #0D8ABC 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: 'white',
                    fontWeight: 800,
                    boxShadow: 'var(--shadow-lg)',
                    overflow: 'hidden'
                  }}>
                    {!localProfile?.photo && (localProfile?.avatar || 'AD')}
                  </div>
                  <div>
                    <input 
                      type="file" 
                      id="profile-upload" 
                      hidden 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLocalProfile(prev => ({ ...prev, photo: reader.result }));
                            showToast("Photo Preview Loaded");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button 
                      className="btn-premium" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                      onClick={() => document.getElementById('profile-upload').click()}
                    >
                      Change Photo
                    </button>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>JPG, GIF or PNG. Max size 2MB</p>
                  </div>
                </div>

                <div className="grid grid-2 gap-4">
                  <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={localProfile?.name || ''} 
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                    />
                  </div>
                  <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={localProfile?.email || ''} 
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>New Password</label>
                  <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} />
                </div>

                <button 
                  className="btn-premium" 
                  style={{ marginTop: '2rem', width: '100%' }}
                  onClick={handleProfileSave}
                >
                  Save Profile Changes
                </button>
              </div>
            )}
            {activeTab === 'performance' && (
              <div className="control-list fade-in">
                <DynamicSwitch 
                  id="aiCore"
                  icon={Bot} 
                  label="AI Core Intelligence" 
                  desc="Gemini-1.5 Auto-Analysis" 
                  active={config.aiCore}
                  onToggle={(val) => updateSetting('aiCore', val)}
                />
                <DynamicSwitch 
                  id="geoRouting"
                  icon={Globe} 
                  label="Geospatial Routing" 
                  desc="Automatic Ward Assignment" 
                  active={config.geoRouting}
                  onToggle={(val) => updateSetting('geoRouting', val)}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="control-list fade-in">
                <DynamicSwitch 
                  id="intrusionShield"
                  icon={Shield} 
                  label="Intrusion Shield" 
                  desc="Real-time IP Filtering" 
                  active={config.intrusionShield}
                  onToggle={(val) => updateSetting('intrusionShield', val)}
                />
                <DynamicSwitch 
                  id="enhancedAudit"
                  icon={Maximize2} 
                  label="Enhanced Audit" 
                  desc="Verbose Action Logging" 
                  active={config.enhancedAudit}
                  onToggle={(val) => updateSetting('enhancedAudit', val)}
                />
              </div>
            )}

            {activeTab === 'notifications' && (
               <div className="control-list fade-in">
                 <DynamicSwitch 
                   id="citizenBroadcast"
                   icon={Bell} 
                   label="Citizen Broadcasts" 
                   desc="Mass WhatsApp Updates" 
                   active={config.citizenBroadcast}
                   onToggle={(val) => updateSetting('citizenBroadcast', val)}
                 />
               </div>
            )}

            {activeTab === 'whatsapp' && (
               <div className="control-list fade-in">
                 <div className="cockpit-card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                   <div className="flex items-center gap-4 mb-4">
                     <div className="icon-wrap" style={{ background: '#25d366', color: 'white' }}>
                       <Bot size={20} />
                     </div>
                     <div>
                       <h4 style={{ fontWeight: 800 }}>WhatsApp Bot Status</h4>
                       <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated Citizen Notifications & AI Chatbot</p>
                     </div>
                   </div>
                   
                   <div style={{ padding: '1.25rem', background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                      <div className="flex justify-between items-center mb-3">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Connection Status</span>
                        <span className="status-badge status-resolved" style={{ fontSize: '0.7rem' }}>ACTIVE</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        The bot is currently initialized and ready to receive complaints. Use the link below to scan the QR code if you are not yet authenticated.
                      </p>
                   </div>

                   <a 
                     href="http://localhost:5001/api/whatsapp/qr" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="btn-premium" 
                     style={{ width: '100%', textDecoration: 'none', justifyContent: 'center', background: '#25d366', color: 'white', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)' }}
                   >
                     <ExternalLink size={16} />
                     Open WhatsApp Link Portal
                   </a>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .toast-notification {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: #0f172a;
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 0.85rem;
          font-weight: 600;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .dynamic-settings-cockpit {
          padding: 1rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .dynamic-status-bar {
          display: flex;
          align-items: center;
          gap: 2rem;
          background: #0f172a;
          color: white;
          padding: 0.875rem 1.5rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-lg);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .status-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          opacity: 0.8;
        }

        .status-group strong {
          color: var(--primary);
        }

        .pulse-icon {
          color: #64748b;
          transition: all 0.3s;
        }

        .pulse-icon.active {
          color: #22c55e;
          animation: icon-pulse 1.5s infinite;
        }

        @keyframes icon-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .sync-btn {
          margin-left: auto;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .sync-btn:hover { background: var(--primary); }
        .sync-btn.spinning { animation: spin 1s linear infinite; }

        .cockpit-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
        }

        .cockpit-card {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          position: relative;
          overflow: hidden;
        }

        .ai-offline-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 1rem;
          z-index: 10;
        }

        .ai-offline-overlay p {
          font-weight: 700;
          font-size: 0.9rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .card-header h3 {
          font-size: 1rem;
          font-weight: 800;
          flex: 1;
        }

        .load-tag {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          background: var(--bg-main);
          border-radius: 4px;
          color: var(--text-muted);
        }

        /* Performance Chart */
        .chart-container {
          height: 180px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          padding: 1rem 0;
          border-bottom: 1px dashed var(--border-color);
        }

        .chart-bar {
          flex: 1;
          border-radius: 4px 4px 0 0;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          padding-top: 0.75rem;
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Tabs Minimal */
        .tabs-minimal {
          display: flex;
          background: var(--bg-main);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .tabs-minimal button {
          flex: 1;
          padding: 0.6rem;
          border: none;
          background: transparent;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .tabs-minimal button.active {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        /* Dynamic Switches */
        .dynamic-switch-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-main);
          border-radius: 1rem;
          margin-bottom: 0.75rem;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid transparent;
          user-select: none;
        }

        .dynamic-switch-row:hover {
          background: white;
          border-color: var(--primary);
          transform: translateX(4px);
        }

        .icon-wrap {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .info-wrap {
          flex: 1;
        }

        .info-wrap label {
          display: block;
          font-size: 0.85rem;
          font-weight: 800;
        }

        .info-wrap span {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .switch-toggle {
          width: 36px;
          height: 20px;
          background: #cbd5e1;
          border-radius: 20px;
          position: relative;
          transition: all 0.3s;
        }

        .switch-toggle::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 3px;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .active .switch-toggle { background: var(--primary); }
        .active .switch-toggle::after { transform: translateX(16px); }

        .control-row-simple {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        }

        .minimal-range {
          width: 100%;
          accent-color: var(--primary);
          height: 4px;
          margin-top: 8px;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .cockpit-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

const DynamicSwitch = ({ icon: Icon, label, desc, active, onToggle }) => {
  return (
    <div className={`dynamic-switch-row ${active ? 'active' : ''}`} onClick={(e) => {
      e.preventDefault();
      onToggle(!active);
    }}>
      <div className="icon-wrap"><Icon size={18} /></div>
      <div className="info-wrap">
        <label>{label}</label>
        <span>{desc}</span>
      </div>
      <div className="switch-toggle"></div>
    </div>
  );
};

export default Settings;
