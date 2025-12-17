// In-Memory Log Store for Dev Console
let memoryLogs = [];

const logEvent = (type, details) => {
    const log = {
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        status: (type === 'ERROR') ? 'ERROR' : 'SUCCESS',
        userMessage: details.userMessage || details.message || "System Event",
        rawOutput: details.rawOutput || details.response || "",
        parsedOutput: details.parsedOutput || details.data || {},
        type
    };

    // Check for duplicates (simple debouncing)
    const last = memoryLogs[0];
    if (last && last.type === log.type && last.timestamp.getTime() === log.timestamp.getTime()) return;

    memoryLogs.unshift(log);
    if (memoryLogs.length > 50) memoryLogs.pop();
};

const getLogs = () => memoryLogs;

module.exports = { logEvent, getLogs };
