import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

const DatePicker = ({ onDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');

  const ranges = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 Days', days: 6 },
    { label: 'Last 30 Days', days: 29 },
    { label: 'This Month', days: 'month' },
    { label: 'All Time', days: 'all' }
  ];

  const handleRangeSelect = (range) => {
    setSelectedRange(range.label);
    setIsOpen(false);

    let start = new Date();
    let end = new Date();

    if (range.label === 'Today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range.label === 'Yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (range.days === 'all') {
      start = new Date(2000, 0, 1);
      end.setHours(23, 59, 59, 999);
    } else if (range.days === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(end.getDate() - range.days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (onDateChange) {
      onDateChange(start, end);
    }
  };

  return (
    <div className="date-picker-container" style={{ position: 'relative' }}>
      <div 
        className={`date-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar size={18} className="text-muted" />
        <span className="date-range-text">{selectedRange}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="date-picker-overlay" onClick={() => setIsOpen(false)} />
          <div className="date-picker-dropdown animate-fade-in">
            <div className="dropdown-header">Select Period</div>
            <div className="range-options">
              {ranges.map((range) => (
                <div 
                  key={range.label} 
                  className={`range-option ${selectedRange === range.label ? 'selected' : ''}`}
                  onClick={() => handleRangeSelect(range)}
                >
                  <span>{range.label}</span>
                  {selectedRange === range.label && <Check size={14} className="text-primary" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        .date-picker-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1.25rem;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          box-shadow: var(--shadow-sm);
        }

        .date-picker-trigger:hover {
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .date-picker-trigger.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .date-range-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          min-width: 120px;
        }

        .chevron {
          transition: transform 0.3s ease;
          color: #64748b;
        }

        .chevron.rotate {
          transform: rotate(180deg);
        }

        .date-picker-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 0.75rem 1rem;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: var(--bg-main);
          border-bottom: 1px solid var(--border-color);
        }

        .range-options {
          padding: 0.4rem;
        }

        .range-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }

        .range-option:hover {
          background: var(--primary-light);
          color: var(--primary);
        }

        .range-option.selected {
          background: var(--primary-light);
          color: var(--primary);
        }

        .date-picker-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
        }

        .text-muted { color: #64748b; }
        .text-primary { color: var(--primary); }
      `}</style>
    </div>
  );
};

export default DatePicker;
