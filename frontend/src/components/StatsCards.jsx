import React from 'react';
import { FileText, Clock, Settings, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const StatsCards = ({ stats }) => {
  const cards = [
    { 
      label: 'Total Complaints', 
      value: stats.total || 0, 
      trend: '+12.5%', 
      isUp: true, 
      icon: FileText, 
      color: '#3b82f6', 
      bg: '#eff6ff' 
    },
    { 
      label: 'Pending', 
      value: stats.pending || 0, 
      trend: '+8.4%', 
      isUp: true, 
      icon: Clock, 
      color: '#f59e0b', 
      bg: '#fffbeb' 
    },
    { 
      label: 'In Progress', 
      value: stats.inProgress || 0, 
      trend: '+10.3%', 
      isUp: true, 
      icon: Settings, 
      color: '#8b5cf6', 
      bg: '#f5f3ff' 
    },
    { 
      label: 'Resolved', 
      value: stats.resolved || 0, 
      trend: '+15.8%', 
      isUp: true, 
      icon: CheckCircle, 
      color: '#10b981', 
      bg: '#ecfdf5' 
    },
    { 
      label: 'Overdue', 
      value: stats.overdue || 0, 
      trend: '-5.2%', 
      isUp: false, 
      icon: AlertTriangle, 
      color: '#ef4444', 
      bg: '#fef2f2' 
    },
  ];

  return (
    <div className="grid grid-5 mb-6 animate-fade-in">
      {cards.map((card, i) => (
        <div key={i} className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: card.bg, color: card.color }}>
            <card.icon size={24} />
          </div>
          <div className="stat-info">
            <h3>{card.label}</h3>
            <p className="value">{card.value.toLocaleString()}</p>
            <div className={`stat-trend ${card.isUp ? 'trend-up' : 'trend-down'}`}>
              {card.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{card.trend}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>vs last month</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
