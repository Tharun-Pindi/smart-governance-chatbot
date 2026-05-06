import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

export const OfficialCharts = ({ complaints }) => {
  // Process data for Category Distribution (Pie)
  const deptCount = {};
  complaints.forEach(c => {
    const dept = c.department || 'General';
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });
  const pieData = Object.keys(deptCount).map(key => ({ name: key, value: deptCount[key] })).sort((a,b) => b.value - a.value);

  // Process data for Monthly Trends (Line)
  const monthCount = {};
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString('default', { month: 'short' }));
  }
  months.forEach(m => monthCount[m] = 0); // Initialize

  complaints.forEach(c => {
    const date = new Date(c.created_at);
    const month = date.toLocaleString('default', { month: 'short' });
    if (monthCount[month] !== undefined) {
      monthCount[month]++;
    }
  });
  const lineData = months.map(m => ({ name: m, complaints: monthCount[m] }));

  // Process data for Ward-wise (Horizontal Bar)
  const wardCount = {};
  complaints.forEach((c, idx) => {
    // Generate a pseudo-ward based on ID or use a default if missing
    let ward = 'Ward ' + ((c.id.charCodeAt(0) % 15) + 1);
    if (c.address && c.address.toLowerCase().includes('ward')) {
       const match = c.address.match(/ward\s*(\d+)/i);
       if (match) ward = 'Ward ' + match[1];
    }
    wardCount[ward] = (wardCount[ward] || 0) + 1;
  });
  const barData = Object.keys(wardCount)
    .map(key => ({ name: key, complaints: wardCount[key] }))
    .sort((a,b) => b.complaints - a.complaints)
    .slice(0, 5); // Top 5 wards

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      <div className="card">
        <h3 className="mb-4" style={{ fontSize: '1rem', color: '#cbd5e1' }}>Complaints Trend</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="complaints" name="Complaints" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#60a5fa', stroke: '#0f172a', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card">
        <h3 className="mb-4" style={{ fontSize: '1rem', color: '#cbd5e1' }}>Complaints by Category</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={60} 
                outerRadius={100} 
                paddingAngle={5} 
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4" style={{ fontSize: '1rem', color: '#cbd5e1' }}>Complaints by Ward (Top 5)</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                itemStyle={{ color: '#e2e8f0' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="complaints" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

