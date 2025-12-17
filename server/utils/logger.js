// Simple In-Memory Logger for Dev Console
const logs = [];
const MAX_LOGS = 50;

const addLog = (entry) => {
    const logItem = {
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        status: entry.status || 'SUCCESS',
        userMessage: entry.userMessage || '',
        rawOutput: entry.rawOutput || '',
        parsedOutput: entry.parsedOutput || {}
    };

    logs.unshift(logItem); // Add to top
    if (logs.length > MAX_LOGS) logs.pop();
};

const getLogs = () => logs;

module.exports = { addLog, getLogs };
