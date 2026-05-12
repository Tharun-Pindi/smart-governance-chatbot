import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import StatsCards from './components/StatsCards';
import ChartsGrid from './components/ChartsGrid';
import MapsGrid from './components/MapsGrid';
import RecentComplaintsTable from './components/RecentComplaintsTable';
import SystemLogs from './components/SystemLogs';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  Eye, Edit2, Search, Filter, ArrowLeft, X, Trash2, Plus,
  LayoutDashboard, MessageSquare, Grid, Map as MapIcon, MapPin, Layers, Users, BarChart3, Bell, Settings as SettingsIcon, HelpCircle, CheckCircle2, Calendar, Download 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001/api';

import ComplaintModal from './components/ComplaintModal';
import Settings from './components/Settings';
import WardDashboard from './components/WardDashboard';
import FeedbackHub from './components/FeedbackHub';


const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'complaints', label: 'Complaints', icon: MessageSquare },
  { id: 'categories', label: 'Categories', icon: Grid },
  { id: 'heatmap', label: 'Heatmap', icon: MapIcon },
  { id: 'mapview', label: 'Map View', icon: MapPin },
  { id: 'wards', label: 'Wards', icon: Layers },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'feedback', label: 'Feedback', icon: HelpCircle },
];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('super_admin');
  const [wardNumber, setWardNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adminName, setAdminName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: 'Admin User',
    email: '',
    avatar: 'A'
  });
  const [admins, setAdmins] = useState([]);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', role: 'ward_admin', ward: '' });
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)), 
    end: new Date() 
  });

  useEffect(() => {
    fetchComplaints();
    fetchAdmins();
    
    const interval = setInterval(() => {
        fetchComplaints();
        fetchAdmins();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/admins`);
      setAdmins(response.data);
    } catch (err) {
      console.error('Failed to fetch admins');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      // Ensure phone number has +91 if missing
      const formattedAdmin = {
        ...newAdmin,
        phone: newAdmin.phone.startsWith('+') ? newAdmin.phone : `+91${newAdmin.phone}`
      };
      
      console.log('Registering new admin:', formattedAdmin);
      const response = await axios.post(`${API_BASE_URL}/auth/admins`, formattedAdmin);
      
      if (response.data) {
        setIsAddAdminModalOpen(false);
        setNewAdmin({ name: '', phone: '', role: 'ward_admin', ward: '' });
        await fetchAdmins();
        alert('Admin registered successfully!');
      }
    } catch (err) {
      console.error('Add Admin Error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || err.message;
      alert(`Failed to add admin: ${errorMsg}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/auth/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      alert('Failed to delete admin');
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints`);
      setComplaints(response.data);
      setError(null);
    } catch (error) {
      console.error('Fetch Error:', error);
      setError("Unable to connect to the backend server. Please make sure the backend is running on port 5001.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/complaints/${id}/status`, { status: newStatus });
      fetchComplaints(); // Refresh list
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDateChange = (start, end) => {
    setDateRange({ start, end });
  };

  const filteredComplaints = complaints.filter(c => {
    if (!c.created_at) return false;
    const complaintDate = new Date(c.created_at);
    if (isNaN(complaintDate.getTime())) return false; // Skip invalid dates
    
    // Ward Admin Data Isolation (or Super Admin Ward Selection)
    let matchesWard = true;
    if (userRole === 'ward_admin' || (userRole === 'super_admin' && wardNumber)) {
      // Use the direct ward field if available, fallback to regex search in address
      const complaintWard = c.ward ? String(c.ward).replace(/\D/g, '') : null;
      const targetWard = wardNumber ? String(wardNumber).replace(/\D/g, '') : null;
      
      if (complaintWard !== targetWard) {
        // Only if direct field fails, try searching the address as a fallback
        const addressMatch = c.address?.match(/Ward\s*(\d+)/i);
        const addressWard = addressMatch ? addressMatch[1] : null;
        if (addressWard !== targetWard) {
          matchesWard = false;
        }
      }
    }
    
    // Fix date boundary issues for real-time updates
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    
    const inRange = complaintDate >= dateRange.start && complaintDate <= endDate;
    const matchesSearch = !searchQuery || 
      String(c.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.address || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesWard && inRange && matchesSearch;
  });

  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter(c => c.status === 'Pending').length,
    inProgress: filteredComplaints.filter(c => (c.status === 'In Progress' || c.status === 'InProgress')).length,
    resolved: filteredComplaints.filter(c => c.status === 'Resolved').length,
    overdue: filteredComplaints.filter(c => c.priority === 'Urgent' && c.status !== 'Resolved').length
  };

  const handleSendOtp = async () => {
    if (!adminName || !phoneNumber) return alert('Please enter your name and phone number');
    setLoginLoading(true);
    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber}`;
      await axios.post(`${API_BASE_URL}/auth/send-otp`, { phone: fullPhone, name: adminName });
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return alert('Please enter OTP');
    setLoginLoading(true);
    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber}`;
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { phone: fullPhone, otp });
      if (res.data.success) {
        const { user } = res.data;
        setUserProfile({
          name: user.name,
          email: `${user.role}@smartgov.in`,
          avatar: user.name.substring(0, 2).toUpperCase(),
          photo: user.photo_url
        });
        setUserRole(user.role);
        setWardNumber(user.wardNumber || '');
        setPhoneNumber(fullPhone); // Ensure the full verified number is stored
        setIsAuthenticated(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleExportData = () => {
    if (filteredComplaints.length === 0) return alert('No data to export');
    
    // Define CSV headers
    const headers = ['ID', 'Date', 'Citizen Name', 'Phone/ID', 'Category', 'Ward', 'Address', 'Status', 'Priority', 'Department', 'Description'];
    
    // Map data to rows
    const rows = filteredComplaints.map(c => {
      const match = c.address?.match(/Ward\s*(\d+)/i) || c.description?.match(/Ward\s*(\d+)/i);
      const wardStr = c.ward || (match ? `Ward ${match[1]}` : 'General');
      
      return [
        `SG-${String(c.id || '').substring(0, 8).toUpperCase()}`,
        new Date(c.created_at).toLocaleString().replace(',', ''),
        c.citizen_name || 'N/A',
        c.citizen_id || 'Anonymous',
        c.category || 'General',
        wardStr,
        `"${(c.address || c.location || 'N/A').replace(/"/g, '""')}"`,
        c.status || 'Pending',
        c.priority || 'Medium',
        c.department || 'N/A',
        `"${(c.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
    });
    
    // Combine into CSV string with Metadata Header
    const csvContent = [
      `"Smart Governance System - Administrative Export"`,
      `"Generated On: ${new Date().toLocaleString()}"`,
      `"Total Records: ${filteredComplaints.length}"`,
      `""`, // Spacing line
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link with full timestamp in filename
    const timestamp = new Date().toLocaleString().replace(/[/, :]/g, '-').replace('--', '_');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SmartGov_FullReport_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto mb-4' }}></div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading Smart Governance System...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ background: 'var(--primary)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white', boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
            <Layers size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Smart Governance</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Secure Admin Authentication</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            {!otpSent ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name</label>
                  <input 
                    type="text"
                    placeholder="Enter your name"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', marginBottom: '1rem' }}
                  />
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{ 
                        width: '80px', 
                        padding: '0.875rem 0.5rem', 
                        borderRadius: '0.75rem', 
                        border: '1px solid var(--border-color)', 
                        background: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (UAE)</option>
                    </select>
                    <input 
                      type="tel"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{ flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Enter your details to receive an OTP.</p>
                </div>
                <button 
                  className="btn-premium" 
                  style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', marginTop: '0.5rem' }}
                  onClick={handleSendOtp}
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Enter 6-Digit OTP</label>
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.5rem', fontWeight: 700 }}
                  />
                </div>
                <button 
                  className="btn-premium" 
                  style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', marginTop: '0.5rem' }}
                  onClick={handleVerifyOtp}
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem' }}
                  onClick={() => setOtpSent(false)}
                >
                  &larr; Use a different number
                </button>
              </>
            )}


          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} wardNumber={wardNumber} />
      
      <main className="main-content">
        <TopHeader 
          userRole={userRole}
          wardNumber={wardNumber}
          setWardNumber={setWardNumber}
          userProfile={userProfile}
          onDateChange={handleDateChange} 
          notificationCount={filteredComplaints.filter(c => c.status === 'Pending').length}
          onNotificationClick={() => setActiveTab('alerts')}
          onProfileClick={() => setActiveTab('settings')}
          onSettingsClick={() => setActiveTab('settings')}
          onLogoutClick={() => {
            if(window.confirm('Are you sure you want to logout?')) {
              window.location.reload();
            }
          }}
        />
        
        {activeTab === 'dashboard' && (
          userRole === 'ward_admin' ? (
            <WardDashboard 
              complaints={filteredComplaints} 
              stats={stats} 
              wardNumber={wardNumber} 
              onSelectComplaint={setSelectedComplaint}
              onViewAll={() => setActiveTab('complaints')}
              onViewImage={setFullscreenImage}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ErrorBoundary>
                <StatsCards stats={stats} />
              </ErrorBoundary>
              <ErrorBoundary>
                <ChartsGrid complaints={filteredComplaints} userRole={userRole} wardNumber={wardNumber} />
              </ErrorBoundary>
              <ErrorBoundary>
                <MapsGrid complaints={filteredComplaints} onSelectComplaint={setSelectedComplaint} selectedComplaint={selectedComplaint} userRole={userRole} wardNumber={wardNumber} view="both" />
              </ErrorBoundary>
              <ErrorBoundary>
                <RecentComplaintsTable 
                  complaints={filteredComplaints} 
                  onSelectComplaint={setSelectedComplaint} 
                  onViewAll={() => setActiveTab('complaints')}
                  onViewImage={setFullscreenImage}
                  userRole={userRole}
                  wardNumber={wardNumber}
                />
              </ErrorBoundary>
            </div>
          )
        )}

        {activeTab === 'complaints' && (
          <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
             <div className="flex justify-between items-center mb-8">
                <div>
                   <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Complaints Database</h2>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monitor and manage all citizen reports in real-time</p>
                </div>
                <button 
                  className="btn-premium" 
                  onClick={() => setActiveTab('dashboard')}
                  style={{ background: 'white', color: 'var(--text-main) !important', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <ArrowLeft size={18} color="var(--text-main)" />
                  Back to Dashboard
                </button>
             </div>

             <div className="flex justify-between items-center mb-6 gap-4">
                <div className="search-container">
                   <Search size={20} color="var(--text-muted)" />
                   <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Search by ID, Category, or Status..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
                <div className="flex gap-2">
                </div>
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
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filtered = filteredComplaints.filter(c => 
                        String(c.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                        String(c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        String(c.status || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        String(c.address || '').toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      if (filtered.length > 0) {
                        return filtered.map((c, index) => {
                          const safeId = String(c?.id || '').substring(0, 8).toUpperCase() || '########';
                          const safeStatus = String(c?.status || 'Pending');
                          const statusClass = safeStatus.toLowerCase().replace(/\s+/g, '');
                          
                          return (
                            <tr key={c?.id || index}>
                              <td style={{ fontWeight: 600 }}>SG-{safeId}</td>
                              <td>
                                {c.media_url ? (
                                  <div 
                                    style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'zoom-in' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFullscreenImage(c.media_url);
                                    }}
                                  >
                                    <img src={c.media_url} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ) : (
                                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    <MessageSquare size={16} />
                                  </div>
                                )}
                              </td>
                              <td>{c?.category || 'General'}</td>
                              <td>{c?.address || c?.location || 'N/A'}</td>
                              <td>
                                {(() => {
                                  const match = c.address?.match(/Ward\s*(\d+)/i) || c.description?.match(/Ward\s*(\d+)/i);
                                  return c.ward || (match ? `Ward ${match[1]}` : 'General');
                                })()}
                              </td>
                              <td>
                                <span className={`status-badge status-${statusClass}`}>
                                  {safeStatus}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{c?.citizen_name || 'N/A'}</td>
                              <td>{c?.citizen_id || 'Anonymous'}</td>
                              <td>{c?.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                <div className="flex gap-2">
                                   <button className="action-btn-modern view" onClick={() => setSelectedComplaint(c)}><Eye size={16}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      } else {
                        return (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                              No results found for "{searchQuery}"
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Full-screen Image Viewer (Lightbox) */}
      {fullscreenImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setFullscreenImage(null)}
        >
          <div 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              color: 'white', 
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)',
              padding: '10px',
              borderRadius: '50%'
            }}
            onClick={() => setFullscreenImage(null)}
          >
            <X size={32} />
          </div>
          <img 
            src={fullscreenImage} 
            alt="Full Screen" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              objectFit: 'contain', 
              borderRadius: '8px',
              boxShadow: '0 0 30px rgba(0,0,0,0.5)'
            }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {selectedComplaint && (
          <ComplaintModal 
            complaint={selectedComplaint} 
            onClose={() => setSelectedComplaint(null)} 
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'categories' && (
          <div className="animate-fade-in" style={{ padding: '1rem' }}>
            <h2 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Category Overview</h2>
            <div className="grid grid-3">
              {Object.entries(filteredComplaints.reduce((acc, c) => {
                const cat = c.category || 'General';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
              }, {})).map(([cat, count]) => (
                <div key={cat} className="card">
                  <div className="flex justify-between items-center">
                    <h3 style={{ fontWeight: 700 }}>{cat}</h3>
                    <span className="status-badge status-resolved">{count} Reports</span>
                  </div>
                  <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '1rem' }}>
                    <div style={{ width: `${Math.min((count / filteredComplaints.length) * 100, 100)}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '2px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'mapview' && (
          <div className="animate-fade-in" style={{ padding: '1rem' }}>
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Geospatial Map View</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time distribution of reported issues across the city</p>
               </div>
               <div className="flex gap-2">
                  <div className="date-picker">
                     <Filter size={16} />
                     <span>Filter by Ward</span>
                  </div>
               </div>
            </div>
            <MapsGrid complaints={filteredComplaints} onSelectComplaint={setSelectedComplaint} selectedComplaint={selectedComplaint} view="live" userRole={userRole} wardNumber={wardNumber} />
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="animate-fade-in" style={{ padding: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
               <div className="avatar" style={{ margin: '0 auto 1rem', width: 64, height: 64, background: 'var(--primary-light)' }}>
                  <MapIcon size={32} color="var(--primary)" />
               </div>
               <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Location Density Heatmap</h2>
               <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0.5rem auto 0' }}>Analyzing clustering of reports in real-time to identify high-priority intervention zones.</p>
            </div>
            <MapsGrid complaints={filteredComplaints} onSelectComplaint={setSelectedComplaint} selectedComplaint={selectedComplaint} view="heatmap" userRole={userRole} wardNumber={wardNumber} />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin & Ward Management</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage system access for Ward Members and Staff</p>
              </div>
              {userRole === 'super_admin' && (
                <button 
                  className="btn-premium" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Opening Add Admin Modal...");
                    setIsAddAdminModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={18} />
                  Add New Admin
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="recent-complaints-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Role</th>
                    <th>Ward Assignment</th>
                    <th>Joined Date</th>
                    {userRole === 'super_admin' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td style={{ fontWeight: 600 }}>{admin.name}</td>
                      <td>{admin.phone}</td>
                      <td>
                        <span className={`status-badge ${admin.role === 'super_admin' ? 'status-urgent' : 'status-resolved'}`}>
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Ward Member'}
                        </span>
                      </td>
                      <td>{admin.ward ? `Ward ${admin.ward}` : 'City-wide'}</td>
                      <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                      {userRole === 'super_admin' && (
                        <td>
                          <button 
                            className="action-btn-modern delete" 
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteAdmin(admin.id)}
                            disabled={admin.phone === phoneNumber} // Can't delete self
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fade-in" style={{ padding: '1rem' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Analytics & Reports</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Detailed breakdown of system performance and complaint trends</p>
              </div>
              <button 
                className="btn-premium" 
                onClick={handleExportData}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                }}
              >
                <Download size={18} />
                Export Data (CSV)
              </button>
            </div>

            <ChartsGrid complaints={filteredComplaints} userRole={userRole} wardNumber={wardNumber} />
            <div className="card mt-6">
              <h3 className="mb-4" style={{ fontWeight: 700 }}>Weekly Performance Summary</h3>
              <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>System resolved <strong>{stats.resolved}</strong> out of <strong>{stats.total}</strong> total reports in the selected period.</p>
            </div>
          </div>
        )}

        {activeTab === 'wards' && (
          <div className="card animate-fade-in" style={{ marginTop: '1rem' }}>
            <h2 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Ward-wise Analysis</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="recent-complaints-table">
                <thead>
                  <tr>
                    <th>Ward / Area</th>
                    <th>Total Reports</th>
                    <th>Urgent Issues</th>
                    <th>Resolution Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(filteredComplaints.reduce((acc, c) => {
                    const match = c.address?.match(/Ward\s*(\d+)/i) || c.description?.match(/Ward\s*(\d+)/i);
                    const ward = c.ward || (match ? `Ward ${match[1]}` : 'General / Central');
                    if (!acc[ward]) acc[ward] = { total: 0, urgent: 0, resolved: 0 };
                    acc[ward].total++;
                    if (c.priority === 'Urgent' || c.priority === 'High') acc[ward].urgent++;
                    if (c.status === 'Resolved' || c.status === 'Solved') acc[ward].resolved++;
                    return acc;
                  }, {})).map(([ward, data]) => (
                    <tr key={ward}>
                      <td style={{ fontWeight: 600 }}>{ward}</td>
                      <td>{data.total}</td>
                      <td><span className={data.urgent > 0 ? 'text-urgent' : ''}>{data.urgent}</span></td>
                      <td>{Math.round((data.resolved / data.total) * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="animate-fade-in" style={{ padding: '1rem' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Active System Alerts</h2>
                <p style={{ color: 'var(--text-muted)' }}>Found {filteredComplaints.filter(c => c.status === 'Pending').length} reports requiring immediate administrative action.</p>
              </div>
            </div>
            
            <div className="grid grid-1" style={{ gap: '1rem' }}>
              {filteredComplaints.filter(c => c.status === 'Pending').map(alert => (
                <div key={alert.id} className="card flex items-center gap-4" style={{ 
                  borderLeft: `4px solid ${alert.priority === 'Urgent' ? '#ef4444' : '#f59e0b'}`, 
                  padding: '1.25rem',
                  transition: 'transform 0.2s ease'
                }}>
                  <div className="avatar" style={{ 
                    background: alert.priority === 'Urgent' ? '#fee2e2' : '#fef3c7', 
                    color: alert.priority === 'Urgent' ? '#ef4444' : '#f59e0b' 
                  }}>
                    <Bell size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{alert.category} Report: {alert.id}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className={`status-badge ${alert.priority === 'Urgent' ? 'status-urgent' : 'status-pending'}`}>
                            {alert.priority} Priority
                          </span>
                        </div>
                      </div>
                      <div className="new-alert-badge">
                        <span className="pulse-dot"></span>
                        NEW CRITICAL ALERT
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                      {alert.description?.substring(0, 120)}...
                    </p>
                    <div className="flex gap-4 mt-4" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {alert.address?.substring(0, 40)}</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> ID: {alert.citizen_id}</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-premium" 
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.8rem', minWidth: '160px' }}
                    onClick={() => {
                      setSelectedComplaint(alert);
                      // Switching tab is optional if modal is global, but good for context
                      setActiveTab('complaints');
                    }}
                  >
                    Open Details & Resolve
                  </button>
                </div>
              ))}
              
              {complaints.filter(c => c.status === 'Pending').length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div className="avatar" style={{ margin: '0 auto 1rem', background: '#f1f5f9' }}>
                    <CheckCircle2 size={24} color="#64748b" />
                  </div>
                  <h3 style={{ fontWeight: 700 }}>No active alerts!</h3>
                  <p style={{ color: 'var(--text-muted)' }}>All citizen complaints are currently being processed or resolved.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <FeedbackHub 
            complaints={filteredComplaints}
            userRole={userRole}
            wardNumber={wardNumber}
            onViewImage={setFullscreenImage}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            userProfile={userProfile} 
            setUserProfile={setUserProfile} 
            phoneNumber={phoneNumber}
            userRole={userRole}
            onAddAdmin={() => setIsAddAdminModalOpen(true)}
          />
        )}

        {activeTab === 'logs' && userRole === 'super_admin' && (
           <SystemLogs />
        )}

        {/* Catch-all for remaining tabs */}
        {!['dashboard', 'complaints', 'categories', 'mapview', 'heatmap', 'users', 'reports', 'wards', 'settings', 'alerts', 'logs', 'feedback'].includes(activeTab) && (

          <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '5rem' }}>
            <div className="avatar" style={{ margin: '0 auto 1.5rem', width: 64, height: 64, background: 'var(--bg-main)' }}>
              {React.createElement(
                (menuItems.find(m => m.id === activeTab)?.icon || SettingsIcon),
                { size: 32, color: 'var(--accent-color)' }
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
            <p style={{ color: 'var(--text-muted)' }}>Fetching live stream for this sector...</p>
            <div style={{ width: 200, height: 4, background: '#e2e8f0', margin: '1.5rem auto', borderRadius: 2, overflow: 'hidden' }}>
              <div className="loading-bar-animation" style={{ width: '60%', height: '100%', background: 'var(--accent-color)' }}></div>
            </div>
          </div>
        )}
        {/* Add Admin Modal */}
        {isAddAdminModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New System Admin</h2>
                <button onClick={() => setIsAddAdminModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter full name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number (with +91)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+919876543210"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Role</label>
                  <select 
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none', background: 'white' }}
                  >
                    <option value="ward_admin">Ward Member / Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {newAdmin.role === 'ward_admin' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ward Assignment</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5"
                      value={newAdmin.ward}
                      onChange={(e) => setNewAdmin({...newAdmin, ward: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button type="button" className="btn-premium" style={{ background: '#f1f5f9', color: '#64748b', flex: 1 }} onClick={() => setIsAddAdminModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-premium" style={{ flex: 1 }}>Register Admin</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
