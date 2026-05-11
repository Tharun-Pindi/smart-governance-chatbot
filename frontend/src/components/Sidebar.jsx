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
  Landmark,
  LogOut,
  Megaphone
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, userRole = 'super_admin', wardNumber = '5' }) => {
  const superAdminMenuItems = [
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

  const wardAdminMenuItems = [
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

  const menuItems = userRole === 'ward_admin' ? wardAdminMenuItems : superAdminMenuItems;

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="sidebar-logo">
          <div className="avatar" style={{ background: 'white', color: 'var(--sidebar-bg)' }}>
            <Landmark size={24} />
          </div>
          <div>
            <h1>Smart Governance</h1>
            <p>{userRole === 'ward_admin' ? 'Ward Admin Dashboard' : 'Super Admin Dashboard'}</p>
          </div>
        </div>



        <nav className="sidebar-nav" style={{ flex: 'none' }}>
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className={`nav-item ${activeTab === item.id && item.id !== 'feedback' ? 'active' : ''}`}
            style={item.id === 'feedback' ? { background: '#3b82f6', color: 'white', marginTop: '1rem' } : {}}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={20} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.hasSub && <ChevronRight size={14} opacity={0.5} />}
          </div>
        ))}
      </nav>
      </div>

      <div className="sidebar-footer" style={{ padding: '1rem' }}>
        <div 
          className="nav-item" 
          style={{ marginBottom: '1rem', color: '#cbd5e1' }}
          onClick={() => {
            if(window.confirm('Are you sure you want to logout?')) {
              window.location.reload();
            }
          }}
        >
          <LogOut size={20} />
          <span style={{ flex: 1 }}>Logout</span>
        </div>

        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button style={{ flex: 1, padding: '8px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>English</button>
          <button style={{ flex: 1, padding: '8px', background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>తెలుగు</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
