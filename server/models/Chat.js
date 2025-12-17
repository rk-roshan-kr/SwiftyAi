const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    id: String,
    sender: { type: String, enum: ['user', 'bot', 'system'] }, // Added 'system' for event logs
    text: String,
    agentType: String,
    timestamp: { type: Date, default: Date.now },
    meta: Object // Store things like { widget: 'SANCTION_LETTER' } here
});

const chatSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    messages: [messageSchema],

    // --- NEW: STATE PERSISTENCE ---
    // Stores the entire Agent Context (kycStep, amount, rate, etc.)
    sessionContext: {
        type: Object,
        default: {}
    },

    activeAgent: { type: String, default: 'MasterAgent' }, // Who is talking?
    lastActive: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;