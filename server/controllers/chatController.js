const Chat = require('../models/Chat');
const MasterAgent = require('../agents/masterAgent');

// Create a new empty session
const createSession = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) return res.status(400).json({ success: false, message: "Mobile number required" });

        const sessionId = Date.now().toString();

        const newChat = await Chat.create({
            sessionId,
            mobile,
            messages: [{
                id: 'welcome',
                text: "Hello! I'm Swifty, your AI Banking Assistant. I can help you with Loans, Accounts, and Payments.",
                sender: 'bot',
                agentType: 'MASTER_AGENT',
                timestamp: new Date()
            }],
            title: 'New Chat'
        });

        res.json({ success: true, sessionId, chat: newChat });
    } catch (error) {
        console.error("Create Session Error:", error);
        res.status(500).json({ success: false, message: "Failed to create session" });
    }
};

// Get a specific session by ID
const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const chat = await Chat.findOne({ sessionId });
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
        res.json({ success: true, chat });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch session" });
    }
};

// Get all sessions for a user (Sidebar History)
const getUserHistory = async (req, res) => {
    try {
        const { mobile } = req.params;
        const history = await Chat.find({ mobile })
            .select('sessionId title updatedAt messages')
            .sort({ updatedAt: -1 })
            .limit(50);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch history" });
    }
};

const deleteChat = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await Chat.findOneAndDelete({ sessionId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete chat" });
    }
};

// [FIXED] Send Message - No DB Saving Here!
const sendMessage = async (req, res) => {
    try {
        const { sessionId, message, mobile } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({ success: false, message: "Missing data" });
        }

        // 1. Prepare Context
        const context = { sessionId, mobile, message };

        // 2. Run Agent System
        // (MasterAgent inside run() handles ALL MongoDB saving now)
        const result = await MasterAgent.run(message, context);

        // 3. Send Response
        // We pass 'messages' array for the UI to render bubbles.
        // We set 'response' to null to prevent the frontend from rendering a "Ghost Bubble" via legacy fallback.
        if (result.messages && Array.isArray(result.messages)) {
            return res.json({
                success: true,
                messages: result.messages,
                response: null
            });
        }

        res.json({ success: true, response: result.response });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ success: false, message: "AI Processing Failed" });
    }
};

module.exports = {
    createSession,
    getSession,
    getUserHistory,
    deleteChat,
    sendMessage
};