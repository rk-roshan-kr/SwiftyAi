const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const MOBILE = '9999999999';

// Helper to delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- TEST UTILS ---
async function startSession(title) {
    try {
        const res = await axios.post(`${API_URL}/chat/start`, {
            mobile: MOBILE,
            title: title || "Test Journey",
            messages: []
        });
        console.log(`\n🆕 Session Created: ${res.data.sessionId} [${title}]`);
        return res.data.sessionId;
    } catch (e) {
        console.error("Failed to start session:", e.message);
        return null;
    }
}

async function chat(sessionId, text) {
    if (!sessionId) return "";
    process.stdout.write(`\n📤 User: "${text}"\n🤖 Bot: `);

    try {
        const res = await axios.post(`${API_URL}/chat`, {
            message: text,
            sessionId: sessionId,
            mobile: MOBILE
        }, { responseType: 'stream' });

        let botResponse = "";
        return new Promise((resolve) => {
            res.data.on('data', chunk => {
                const str = chunk.toString();
                process.stdout.write(str);
                botResponse += str;
            });
            res.data.on('end', () => {
                process.stdout.write("\n");
                resolve(botResponse);
            });
        });
    } catch (e) {
        console.error("❌ Chat Failed:", e.message);
        return "";
    }
}

// --- SCENARIO 1: AGENT SIGNAL & WIDGET VISIBILITY ---
async function runSignalTest() {
    console.log("\n🔷 SCENARIO 1: AGENT & WIDGET SIGNAL TEST 🔷");
    const sessionId = await startSession("Signal Test");

    const resp = await chat(sessionId, "Hi, I want a loan");

    // CHECK 1: Agent Signal
    if (resp.includes("||AGENT:SalesAgent||")) {
        console.log("✅ Agent Signal Detected: ||AGENT:SalesAgent|| (Frontend will hide this)");
    } else {
        console.log("❌ FAIL: No Agent Signal detected!");
    }

    // CHECK 2: Widget Signal
    if (resp.includes("||WIDGET:PRODUCT_LIST||")) {
        console.log("✅ Widget Signal Detected: ||WIDGET:PRODUCT_LIST|| (Frontend will parse this)");
    } else {
        console.log("❌ FAIL: No Widget Signal detected!");
    }
}

// --- SCENARIO 2: ROBUST NEGOTIATION (The "Okay" Bug Fix) ---
async function runNegotiationTest() {
    console.log("\n🔷 SCENARIO 2: NEGOTIATION & AGREEMENT 🔷");
    const sessionId = await startSession("Negotiation Fix");

    await chat(sessionId, "I want a personal loan for 5 lakhs");
    await sleep(500);

    // 1. Negotiation Loop
    console.log("👉 Testing Negotiation Refusal (Lowball 9%)");
    const lowball = await chat(sessionId, "I want 9% interest");

    if (lowball.includes("10.5%") || lowball.includes("too low")) {
        console.log("✅ Lowball Refused Correctly.");
    } else {
        console.log("❌ Bot accepted lowball or hallucinated.");
    }

    // 2. Agreement (The Critical "Okay" Test)
    console.log("👉 Testing Agreement ('Okay')");
    const agreed = await chat(sessionId, "Okay, that works");

    if (agreed.includes("Sanction Letter") || agreed.includes("APPROVED") || agreed.includes("SalesAgent")) {
        // Note: Depending on auto-chaining, it might be SalesAgent confirming or Underwriting taking over.
        // As long as it didn't reset to "Hello! I'm Swifty...", it's a pass.
        if (agreed.includes("Hello! I'm Swifty")) {
            console.log("❌ CRITICAL FAIL: Bot Reset Session on 'Okay'");
        } else {
            console.log("✅ Bot Continued Flow (Did not reset)");
        }
    }
}

// --- SCENARIO 3: CONTEXT RETENTION (Product Switching) ---
async function runContextTest() {
    console.log("\n🔷 SCENARIO 3: CONTEXT RETENTION 🔷");
    const sessionId = await startSession("Context Test");

    // 1. Establish Personal Loan
    await chat(sessionId, "I want a personal loan");

    // 2. Ask for something unrelated (Car)
    const switchResp = await chat(sessionId, "Actually, what about a car loan?");

    if (switchResp.toLowerCase().includes("8.5") || switchResp.toLowerCase().includes("velocity")) {
        console.log("✅ Context Switched to Car Loan correctly.");
    } else {
        console.log("❌ Bot stuck on Personal Loan.");
    }
}

// --- MAIN RUNNER ---
async function main() {
    await runSignalTest();
    await sleep(2000);

    await runNegotiationTest();
    await sleep(2000);

    await runContextTest();

    console.log("\n🚀 ALL NEW SCENARIOS COMPLETE 🚀");
}

main();
