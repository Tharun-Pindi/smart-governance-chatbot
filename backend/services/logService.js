const EventEmitter = require('events');

class LogEmitter extends EventEmitter {}
const logEmitter = new LogEmitter();

const logs = [];
const MAX_LOGS = 100;

const log = (level, message, metadata = {}) => {
    const logEntry = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        level, // INFO, WARN, ERROR, SUCCESS
        message,
        metadata
    };

    logs.unshift(logEntry);
    if (logs.length > MAX_LOGS) logs.pop();

    logEmitter.emit('new-log', logEntry);
    
    // Also print to actual console for dev
    const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : level === 'SUCCESS' ? '\x1b[32m' : '\x1b[36m';
    console.log(`${color}[${level}]\x1b[0m ${message}`);
};

module.exports = {
    logEmitter,
    getLogs: () => logs,
    info: (msg, meta) => log('INFO', msg, meta),
    warn: (msg, meta) => log('WARN', msg, meta),
    error: (msg, meta) => log('ERROR', msg, meta),
    success: (msg, meta) => log('SUCCESS', msg, meta),
};
