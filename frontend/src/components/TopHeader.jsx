import React from 'react';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import DatePicker from './DatePicker';

const TopHeader = ({ userRole, userProfile, onDateChange, notificationCount, onNotificationClick, onProfileClick, onSettingsClick, onLogoutClick }) => {
  console.log("Header Notification Count:", notificationCount);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleAction = (callback) => {
    setIsProfileOpen(false);
    if (callback) callback();
  };

  return (
    <header className="top-header animate-fade-in">
      <div className="header-left">
        <h2>Welcome back, {userRole === 'citizen' ? 'Tharun' : 'Admin'}! 👋</h2>
        <p>Here's what's happening in your area today.</p>
      </div>
      
      <div className="header-right">
        <DatePicker onDateChange={onDateChange} />
        
        <div 
          className="card notification-bell" 
          onClick={onNotificationClick}
          style={{ padding: '0.625rem', borderRadius: '0.75rem', position: 'relative', cursor: 'pointer' }}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: -4, 
              right: -4, 
              background: 'var(--danger)', 
              color: 'white', 
              fontSize: '0.625rem', 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px solid white',
              fontWeight: 'bold'
            }}>
              {notificationCount}
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative' }}>
          <div 
            className="flex items-center gap-3" 
            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '12px', transition: 'background 0.2s' }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div className="avatar" style={{ 
              background: userProfile?.photo ? `url(${userProfile.photo}) center/cover` : '#f1f5f9', 
              color: '#64748b', 
              fontWeight: 700, 
              fontSize: '0.75rem',
              overflow: 'hidden'
            }}>
              {!userProfile?.photo && (userProfile?.avatar || 'AD')}
            </div>
            <div className="flex items-center gap-1">
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{userProfile?.name || 'Admin'}</span>
              <ChevronDown size={14} style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>
          </div>

          {isProfileOpen && (
            <div 
              style={{ 
                position: 'absolute', 
                top: 'calc(100% + 10px)', 
                right: 0, 
                width: '180px', 
                background: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                border: '1px solid var(--border-color)', 
                zIndex: 1000, 
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <div style={{ padding: '8px' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => handleAction(onProfileClick)}
                >
                  <User size={16} />
                  <span>Profile Settings</span>
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--danger)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => handleAction(onLogoutClick)}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
