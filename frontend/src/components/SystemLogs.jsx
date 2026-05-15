import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Shield, Cpu, Wifi, Activity, Trash2, Download, 
  Search, Filter, CheckCircle2, AlertCircle, AlertTriangle, 
  Info, ChevronDown, ChevronRight, XCircle, RefreshCw
} from 'lucide-react';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [expandedLogs, setExpandedLogs] = useState(new Set());
    const scrollRef = useRef(null);

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:5001/api/logs/stream');

        eventSource.onmessage = (event) => {
            const newLog = JSON.parse(event.data);
            setLogs(prev => [newLog, ...prev].slice(0, 200)); 
        };

        eventSource.onerror = () => {
            console.error("Logs SSE connection failed.");
            eventSource.close();
        };

        return () => eventSource.close();
    }, []);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs, autoScroll]);

    const getLevelConfig = (level) => {
        switch (level) {
            case 'SUCCESS': return { color: '#10b981', icon: <CheckCircle2 size={14} />, bg: 'rgba(16, 185, 129, 0.1)' };
            case 'ERROR': return { color: '#ef4444', icon: <XCircle size={14} />, bg: 'rgba(239, 68, 68, 0.1)' };
            case 'WARN': return { color: '#f59e0b', icon: <AlertTriangle size={14} />, bg: 'rgba(245, 158, 11, 0.1)' };
            default: return { color: '#3b82f6', icon: <Info size={14} />, bg: 'rgba(59, 130, 246, 0.1)' };
        }
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedLogs(newExpanded);
    };

    const clearLogs = () => setLogs([]);

    const downloadLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        a.click();
    };

    const filteredLogs = logs.filter(log => {
        const matchesFilter = activeFilter === 'ALL' || log.level === activeFilter;
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: logs.length,
        errors: logs.filter(l => l.level === 'ERROR').length,
        warnings: logs.filter(l => l.level === 'WARN').length,
        success: logs.filter(l => l.level === 'SUCCESS').length
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>Live Terminal</h2>
                    <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }}></span>
                        Monitoring system kernel & AI gateway activity
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        className="btn-premium" 
                        onClick={downloadLogs} 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '0.6rem 1.2rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                            border: 'none'
                        }}
                    >
                        <Download size={16} /> Export Logs
                    </button>
                    <button 
                        className="btn-premium" 
                        onClick={clearLogs} 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '0.6rem 1.2rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                            border: 'none'
                        }}
                    >
                        <Trash2 size={16} /> Flush
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-4 mb-6">
                {[
                    { label: 'Event Stream', value: 'Active', icon: <RefreshCw size={20} />, color: '#3b82f6', sub: 'SSE Connected' },
                    { label: 'Error Rate', value: `${stats.errors}`, icon: <AlertCircle size={20} />, color: stats.errors > 0 ? '#ef4444' : '#10b981', sub: 'Last 200 events' },
                    { label: 'AI Latency', value: '24ms', icon: <Cpu size={20} />, color: '#8b5cf6', sub: 'Gemini-1.5-Flash' },
                    { label: 'Bot Status', value: 'Idle', icon: <Wifi size={20} />, color: '#10b981', sub: 'Waiting for triggers' }
                ].map((m, i) => (
                    <div key={i} className="card" style={{ 
                        padding: '1.25rem', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        transition: 'transform 0.2s'
                    }}>
                        <div className="flex justify-between items-start mb-2">
                            <div style={{ color: m.color, background: `${m.color}15`, padding: '8px', borderRadius: '10px', boxShadow: `0 0 15px ${m.color}20` }}>{m.icon}</div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{m.label}</span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>{m.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.sub}</div>
                    </div>
                ))}
            </div>

            {/* Terminal Container */}
            <div className="card" style={{ 
                background: '#0d1117', 
                border: '1px solid #30363d', 
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                {/* Terminal Header & Controls */}
                <div style={{ 
                    background: '#161b22', 
                    padding: '20px 28px', 
                    borderBottom: '1px solid #30363d',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56', boxShadow: '0 0 8px rgba(255, 95, 86, 0.4)' }}></div>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 8px rgba(255, 189, 46, 0.4)' }}></div>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f', boxShadow: '0 0 8px rgba(39, 201, 63, 0.4)' }}></div>
                            </div>
                            <div style={{ width: '1px', height: '20px', background: '#30363d', margin: '0 4px' }}></div>
                            <span style={{ color: '#8b949e', fontSize: '0.8rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                kernel@smartgov:~$ <span style={{ color: '#c9d1d9' }}>tail -f system.log</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3" style={{ background: '#0d1117', padding: '6px 12px', borderRadius: '100px', border: '1px solid #30363d' }}>
                                <span style={{ color: '#8b949e', fontSize: '0.75rem', fontWeight: 600 }}>Auto-scroll</span>
                                <div 
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    style={{ 
                                        width: '36px', 
                                        height: '20px', 
                                        background: autoScroll ? '#3b82f6' : '#30363d', 
                                        borderRadius: '100px', 
                                        position: 'relative', 
                                        cursor: 'pointer',
                                        transition: 'background 0.3s'
                                    }}
                                >
                                    <div style={{ 
                                        width: '14px', 
                                        height: '14px', 
                                        background: 'white', 
                                        borderRadius: '50%', 
                                        position: 'absolute', 
                                        top: '3px', 
                                        left: autoScroll ? '19px' : '3px',
                                        transition: 'left 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
                            <input 
                                type="text"
                                placeholder="Search kernel messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    background: '#0d1117', 
                                    border: '1px solid #30363d', 
                                    borderRadius: '12px', 
                                    padding: '12px 12px 12px 44px',
                                    color: '#c9d1d9',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#30363d'}
                            />
                        </div>
                        <div className="flex gap-1" style={{ background: '#0d1117', padding: '5px', borderRadius: '14px', border: '1px solid #30363d' }}>
                            {['ALL', 'SUCCESS', 'WARN', 'ERROR', 'INFO'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '10px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: activeFilter === f ? '#3b82f6' : 'transparent',
                                        color: activeFilter === f ? '#fff' : '#8b949e',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: activeFilter === f ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Log Feed */}
                <div 
                    ref={scrollRef}
                    style={{ 
                        height: '600px', 
                        overflowY: 'auto', 
                        padding: '20px',
                        fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        color: '#c9d1d9',
                        scrollBehavior: 'smooth'
                    }}
                >
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-column items-center justify-center h-full" style={{ color: '#484f58' }}>
                            <Activity size={48} className="mb-4 opacity-10" />
                            <p>{searchTerm || activeFilter !== 'ALL' ? 'No logs match your filter' : 'Initializing event stream...'}</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const config = getLevelConfig(log.level);
                            const isExpanded = expandedLogs.has(log.id);
                            return (
                                <div key={log.id} style={{ 
                                    marginBottom: '4px', 
                                    borderBottom: '1px solid #21262d', 
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: isExpanded ? '#161b22' : 'transparent',
                                    transition: 'background 0.2s'
                                }}>
                                    <div className="flex items-center gap-3">
                                        <span style={{ color: '#484f58', minWidth: '90px' }}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                        </span>
                                        <span style={{ 
                                            color: config.color, 
                                            fontWeight: 700, 
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: config.bg,
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            minWidth: '95px'
                                        }}>
                                            {config.icon}
                                            {log.level}
                                        </span>
                                        <span style={{ color: '#e6edf3', flex: 1 }}>{log.message}</span>
                                        
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <button 
                                                onClick={() => toggleExpand(log.id)}
                                                style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isExpanded && log.metadata && (
                                        <div style={{ 
                                            margin: '12px 0 8px 105px', 
                                            padding: '12px',
                                            background: '#0d1117',
                                            borderRadius: '8px',
                                            border: '1px solid #30363d',
                                            fontSize: '0.75rem',
                                            color: '#8b949e',
                                            overflowX: 'auto'
                                        }}>
                                            <pre style={{ margin: 0 }}>
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                
                {/* Terminal Footer */}
                <div style={{ padding: '8px 24px', background: '#161b22', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#484f58', display: 'flex', gap: '15px' }}>
                        <span>MATCHES: {filteredLogs.length}</span>
                        <span>SESSION ERRORS: {stats.errors}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#484f58' }}>
                        SMARTGOV-TERMINAL V2.4.1
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default SystemLogs;
