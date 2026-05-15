import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import MapsGrid from './MapsGrid';
import { Eye, Edit2, Download, Upload, Plus, MessageCircle, ChevronRight } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import StatsCards from './StatsCards';
import MediaRenderer from './MediaRenderer';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

const WardDashboard = ({ complaints, stats, wardNumber, onSelectComplaint, onViewAll, onViewImage }) => {
  // Chart Data Preparation
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  }).reverse();

  const trendDataMap = complaints.reduce((acc, c) => {
    if (!c.created_at) return acc;
    const date = new Date(c.created_at);
    const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {});

  const trendData = last6Months.map(month => ({
    name: month,
    value: trendDataMap[month] || 0
  }));

  const categoryCounts = complaints.reduce((acc, c) => {
    const cat = c.category || 'Others';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryPieData = Object.keys(categoryCounts).map(name => ({
    name, value: categoryCounts[name]
  })).slice(0, 5);

  const statusCounts = complaints.reduce((acc, c) => {
    const status = c.status || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusPieData = Object.keys(statusCounts).map(name => ({
    name, value: statusCounts[name]
  }));



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <ErrorBoundary>
        <StatsCards stats={stats} />
      </ErrorBoundary>

      {/* Row 2: Charts and Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1.5rem' }}>
        {/* Trend */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Complaints Trend</h3>
            <select style={{ border: '1px solid var(--border-color)', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
              <option>Monthly</option>
            </select>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="card">
          <h3 className="mb-4" style={{ fontSize: '0.9rem', fontWeight: 700 }}>Complaints by Category</h3>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryPieData.length ? categoryPieData : [{name: 'No Data', value: 1}]} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {(categoryPieData.length ? categoryPieData : [{name: 'No Data', value: 1}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {categoryPieData.map((entry, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{complaints.length ? Math.round((entry.value/complaints.length)*100) : 0}% ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Pie */}
        <div className="card">
          <h3 className="mb-4" style={{ fontSize: '0.9rem', fontWeight: 700 }}>Complaints by Status</h3>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData.length ? statusPieData : [{name: 'No Data', value: 1}]} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {(statusPieData.length ? statusPieData : [{name: 'No Data', value: 1}]).map((entry, index) => {
                    const color = entry.name === 'Pending' ? '#f59e0b' : entry.name === 'Resolved' ? '#10b981' : '#3b82f6';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {statusPieData.map((entry, i) => {
              const color = entry.name === 'Pending' ? '#f59e0b' : entry.name === 'Resolved' ? '#10b981' : '#3b82f6';
              return (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }}></div>
                  <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                </div>
                <span style={{ fontWeight: 600 }}>{complaints.length ? Math.round((entry.value/complaints.length)*100) : 0}% ({entry.value})</span>
              </div>
            )})}
          </div>
        </div>

        {/* Ward Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="mb-6" style={{ fontSize: '0.9rem', fontWeight: 700 }}>Ward Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ward</span>
              <span style={{ fontWeight: 600 }}>{wardNumber}</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Area</span>
              <span style={{ fontWeight: 600 }}>2.35 km²</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Population</span>
              <span style={{ fontWeight: 600 }}>18,650</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Complaints</span>
              <span style={{ fontWeight: 600 }}>{stats.total}</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>This Month Growth</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>+11.1%</span>
            </div>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', textAlign: 'left', marginTop: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View Ward Profile <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Row 3: Maps */}
      <MapsGrid 
        complaints={complaints} 
        onSelectComplaint={onSelectComplaint} 
        view="both" 
        userRole="super_admin" 
        wardNumber={wardNumber} 
      />

      {/* Row 4: Recent Complaints Table */}
      <div className="card animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Complaints</h3>
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
                <th>Reported By</th>
                <th>Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>SG-{c.id ? c.id.substring(0, 4) : '####'}</td>
                  <td>
                    {c.media_url ? (
                      <div 
                        style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'zoom-in' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewImage(c.media_url);
                        }}
                      >
                        <MediaRenderer url={c.media_url} alt="Media" thumbnail={true} />
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
                  <td>{c.citizen_id || '+91 98765 43210'}</td>
                  <td>
                    {new Date(c.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                    {new Date(c.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </td>
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
    </div>
  );
};

export default WardDashboard;
