const mongoose = require('mongoose');
const Chat = require('../models/Chat');

// Connect to DB (Same URI as server)
const MONGO_URI = 'mongodb://localhost:27017/swifty_ai';

const verify = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const count = await Chat.countDocuments();
        console.log(`📊 Total Chats in DB: ${count}`);

        if (count > 0) {
            const chats = await Chat.find().sort({ updatedAt: -1 }).limit(5);
            console.log("\n--- Latest 5 Chats ---");
            chats.forEach(c => {
                console.log(`\nID: ${c.sessionId}`);
                console.log(`Title: ${c.title}`);
                console.log(`Mobile: ${c.mobile}`);
                console.log(`Messages: ${c.messages.length}`);
                console.log(`Last Active: ${c.updatedAt}`);
            });
        } else {
            console.log("⚠️ No chats found. The database is empty.");
        }

    } catch (e) {
        console.error("❌ Error checking DB:", e);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected.");
    }
};

verify();
