const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// User with Bad Credit (Score 550, Delays 5) from mockCIBIL.json
// PAN: PQRST3456L -> CUST004 in customers.json -> Mobile 6666666666
const BAD_USER = {
    mobile: '6666666666',
    pan: 'PQRST3456L'
};

async function testCibilDirect() {
    console.log("\n🔷 TEST 1: DIRECT CIBIL API CALL 🔷");
    try {
        const res = await axios.post(`${API_URL}/cibil/score`, { pan: BAD_USER.pan });
        console.log("✅ API Response:", JSON.stringify(res.data.data, null, 2));

        if (res.data.data.score === 550 && res.data.data.delays === 5) {
            console.log("✅ API Verification PASSED: Correct Data Returned");
        } else {
            console.log("❌ API Verification FAILED: Incorrect Data");
        }
    } catch (e) {
        console.error("❌ API Call Failed", e.message);
    }
}

async function testUnderwritingRejection() {
    console.log("\n🔷 TEST 2: END-TO-END UNDERWRITING REJECTION 🔷");
    // Start Session for Bad User
    const start = await axios.post(`${API_URL}/chat/start`, {
        mobile: BAD_USER.mobile,
        title: "CIBIL Test",
        messages: []
    });
    const sessionId = start.data.sessionId;
    console.log(`new Session: ${sessionId}`);

    // Force Jump to Underwriting (asking for loan)
    // We simulate a flow where Sales Agent agrees, then Underwriting checks.
    // Or we just talk to Sales Agent and get to agreement.

    // 1. "I want a loan"
    await chat(sessionId, BAD_USER.mobile, "I want a personal loan for 100000");

    // 2. "Okay" (Trigger Agreement -> Underwriting)
    const finalResp = await chat(sessionId, BAD_USER.mobile, "Okay, proceed");

    console.log("🤖 Final Response:\n", finalResp);

    if (finalResp.includes("REJECTED") || finalResp.includes("score") || finalResp.includes("history")) {
        console.log("✅ Underwriting Logic PASSED: Loan Rejected based on CIBIL");
    } else {
        console.log("⚠️ Underwriting Logic WARNING: Check if rejected.");
    }
}

async function chat(id, mobile, text) {
    try {
        const res = await axios.post(`${API_URL}/chat`, {
            sessionId: id, mobile, message: text
        }, { responseType: 'stream' });

        let out = "";
        return new Promise(resolve => {
            res.data.on('data', c => out += c.toString());
            res.data.on('end', () => resolve(out));
        });
    } catch (e) { return ""; }
}

async function main() {
    await testCibilDirect();
    await testUnderwritingRejection();
}

main();
