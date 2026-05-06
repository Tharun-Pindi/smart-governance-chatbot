import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Grid, 
  Map as MapIcon, 
  MapPin, 
  Layers, 
  Users, 
  BarChart3, 
  Bell, 
  Settings, 
  HelpCircle,
  ChevronRight,
  Landmark
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare, hasSub: true },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'heatmap', label: 'Heatmap', icon: MapIcon },
    { id: 'mapview', label: 'Map View', icon: MapPin },
    { id: 'wards', label: 'Wards', icon: Layers },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'feedback', label: 'Feedback', icon: HelpCircle },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="avatar" style={{ background: 'white', color: 'var(--sidebar-bg)' }}>
          <Landmark size={24} />
        </div>
        <div>
          <h1>Smart Governance</h1>
          <p>Admin Dashboard</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={20} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.hasSub && <ChevronRight size={14} opacity={0.5} />}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-small">
          <div className="avatar">AD</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Admin User</p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Administrator</p>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
