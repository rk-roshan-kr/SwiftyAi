const Chat = require('../models/Chat');
const masterAgent = require('../agents/masterAgent');
const { logEvent, getLogs } = require('../utils/logger');

// Retrieve logs for Dev Console
const getLogsHandler = (req, res) => res.json(getLogs());

const chatWithAI = async (req, res) => {
    try {
        const { message, sessionId, mobile } = req.body;
        console.log(`[AI] Request received. Session: ${sessionId}, Msg: ${message}`);

        if (!message || !sessionId) {
            return res.status(400).json({ success: false, message: "Message and SessionID required" });
        }

        // 1. Retrieve or Initialize Chat Session
        let chat = await Chat.findOne({ sessionId });
        if (!chat) {
            chat = new Chat({
                sessionId,
                mobile: mobile || 'anonymous',
                messages: [],
                title: message.substring(0, 30) + "..."
            });
        }

        logEvent('USER_INPUT', { message, sessionId });

        // Save User Message Immediately
        chat.messages.push({
            id: Date.now().toString(),
            sender: 'user',
            text: message,
            timestamp: new Date()
        });
        await chat.save();

        // 2. Call Master Agent
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Execute Agent Logic
        const agentResult = await masterAgent.run(message, { sessionId, mobile });
        const botResponse = agentResult.response;

        // Stream the response (simulated for UI compatibility)
        // Stream the response (simulated for UI compatibility)
        const chunks = botResponse.match(/.{1,10}/g) || [botResponse];
        for (const chunk of chunks) {
            res.write(chunk);
            await new Promise(resolve => setTimeout(resolve, 30)); // Tiny delay for effect
        }

        // --- UI SYNC SIGNAL ---
        // Send a hidden signal to trigger Frontend Widgets based on Master Agent State
        if (agentResult.status === 'WAITING_FOR_DOC' || agentResult.status === 'NEEDS_DOCUMENT') {
            res.write("||WIDGET:KYC_WIDGET||");
        } else if (agentResult.status === 'COMPLETED' || agentResult.status === 'APPROVED_INSTANT') {
            res.write("||WIDGET:SANCTION_LETTER||");
            // Also send data if needed, but for now just trigger
        }

        res.end();

        // 3. Save Bot Message to DB
        chat.messages.push({
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: botResponse,
            agentType: 'MASTER_AGENT',
            timestamp: new Date()
        });

        // Update Title if needed
        if (chat.messages.length <= 4) {
            chat.title = message.length > 30 ? message.substring(0, 30) + "..." : message;
        }

        await chat.save();
        logEvent('AI_COMPLETE', { response: botResponse, step: agentResult.status });

    } catch (error) {
        console.error("AI Controller Error:", error);
        logEvent('ERROR', { error: error.message });
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "AI Connection Failed" });
        } else {
            res.end();
        }
    }
};

module.exports = { chatWithAI, getLogs: getLogsHandler };
