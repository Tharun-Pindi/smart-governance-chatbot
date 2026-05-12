import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, Wifi, Activity, Trash2, Download } from 'lucide-react';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:5001/api/logs/stream');

        eventSource.onmessage = (event) => {
            const newLog = JSON.parse(event.data);
            setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100
        };

        eventSource.onerror = () => {
            console.error("Logs SSE connection failed.");
            eventSource.close();
        };

        return () => eventSource.close();
    }, []);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0; // Since we are unshifting, newest is at top
        }
    }, [logs, autoScroll]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'SUCCESS': return '#10b981'; // Green
            case 'ERROR': return '#ef4444'; // Red
            case 'WARN': return '#f59e0b'; // Amber
            default: return '#3b82f6'; // Blue
        }
    };

    const clearLogs = () => setLogs([]);

    const downloadLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString()}.txt`;
        a.click();
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>System Logs</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time monitoring of API, AI, and WhatsApp bot activity.</p>
                </div>

            </div>

            {/* Status Cards */}
            <div className="grid grid-4 mb-6">
                <div className="card flex items-center gap-4" style={{ padding: '1.25rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}>
                        <Cpu size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gemini AI</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Operational</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4" style={{ padding: '1.25rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '12px' }}>
                        <Wifi size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp Bot</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Active</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4" style={{ padding: '1.25rem' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '10px', borderRadius: '12px' }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Supabase DB</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Healthy</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4" style={{ padding: '1.25rem' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>System Load</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>Normal</div>
                    </div>
                </div>
            </div>

            {/* Terminal Container */}
            <div className="card" style={{ 
                background: '#0d1117', 
                border: '1px solid #30363d', 
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)'
            }}>
                <div style={{ 
                    background: '#161b22', 
                    padding: '12px 20px', 
                    borderBottom: '1px solid #30363d',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }}></div>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }}></div>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }}></div>
                        </div>
                        <span style={{ color: '#8b949e', fontSize: '0.85rem', fontFamily: 'monospace', marginLeft: '10px' }}>
                            <Terminal size={14} className="inline mr-2" />
                            admin@smartgov-system:~/logs
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2" style={{ color: '#8b949e', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={autoScroll} 
                                onChange={(e) => setAutoScroll(e.target.checked)}
                                style={{ accentColor: '#3b82f6' }}
                            />
                            Auto-scroll
                        </label>
                    </div>
                </div>

                <div 
                    ref={scrollRef}
                    style={{ 
                        height: '500px', 
                        overflowY: 'auto', 
                        padding: '20px',
                        fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        color: '#c9d1d9'
                    }}
                >
                    {logs.length === 0 ? (
                        <div className="flex flex-column items-center justify-center h-full" style={{ color: '#484f58' }}>
                            <Activity size={48} className="mb-4 opacity-20" />
                            <p>Waiting for incoming system events...</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} style={{ marginBottom: '8px', borderBottom: '1px solid #21262d', paddingBottom: '8px' }}>
                                <span style={{ color: '#8b949e', marginRight: '10px' }}>
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span style={{ 
                                    color: getLevelColor(log.level), 
                                    fontWeight: 700, 
                                    marginRight: '12px',
                                    display: 'inline-block',
                                    minWidth: '70px'
                                }}>
                                    [{log.level}]
                                </span>
                                <span style={{ color: '#e6edf3' }}>{log.message}</span>
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <pre style={{ 
                                        margin: '8px 0 0 92px', 
                                        color: '#8b949e', 
                                        fontSize: '0.75rem',
                                        background: '#161b22',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #30363d'
                                    }}>
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemLogs;
