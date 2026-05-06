import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, 
  BarChart, Bar
} from 'recharts';

const ChartsGrid = ({ complaints }) => {
  // Real data for trend (Last 6 months)
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

  // Category data from actual complaints
  const categoryCounts = complaints.reduce((acc, c) => {
    const cat = c.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(categoryCounts).map(name => ({
    name, value: categoryCounts[name]
  })).slice(0, 5); // Top 5

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

  // Real data for Departments (replacing Ward mock data)
  const deptCounts = complaints.reduce((acc, c) => {
    const dept = c.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  let wardData = Object.keys(deptCounts).map(name => ({
    name, value: deptCounts[name]
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5 Departments

  if (wardData.length === 0) {
    wardData = [{ name: 'Awaiting AI Data...', value: 0 }];
  }

  return (
    <div className="grid grid-3 mb-6 animate-fade-in">
      {/* Trend Chart */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Complaints Trend</h3>
          <select style={{ border: 'none', background: 'var(--bg-main)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
            <option>Monthly</option>
          </select>
        </div>
        <div style={{ height: 250 }}>
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

      {/* Category Chart */}
      <div className="card">
        <h3 className="mb-6" style={{ fontSize: '1rem', fontWeight: 700 }}>Complaints by Category</h3>
        <div style={{ height: 250, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="60%" height="100%">
            <PieChart>
              <Pie
                data={pieData.length > 0 ? pieData : [{name: 'No Data', value: 1}]}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {(pieData.length > 0 ? pieData : [{name: 'No Data', value: 1}]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ width: '40%', fontSize: '0.75rem' }}>
            {pieData.length === 0 ? (
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#cbd5e1' }}></div>
                <span style={{ color: 'var(--text-muted)' }}>Waiting for AI Data...</span>
              </div>
            ) : pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                  {complaints.length > 0 ? Math.round((entry.value / complaints.length) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Chart */}
      <div className="card">
        <h3 className="mb-6" style={{ fontSize: '1rem', fontWeight: 700 }}>Complaints by Department (Top 5)</h3>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={wardData}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsGrid;
