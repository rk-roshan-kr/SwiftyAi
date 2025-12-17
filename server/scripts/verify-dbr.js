const axios = require('axios');

async function testDBRLogic() {
    // 1. GOOD CASE: CUST005 (Vikram)
    // Salary: 60k. Existing: 15k. Limit: 400k. Limit*2 = 800k.
    // Asks for 600k.
    // ROI 12.5%. Tenure 60.
    // New EMI ~ 13,500. 
    // Total = 28,500. DBR = 47.5% (PASS).

    // 2. BAD CASE: CUST007 (Rohan)
    // Salary: 150k. Existing: 90k (High!). Limit: 800k.
    // Asks for 1200k.
    // ROI 11.8%.
    // New EMI ~ 26,000.
    // Total = 116,000. Ratio = 77% (FAIL).

    const flows = [
        { id: 'CUST005', ask: 600000, name: 'Vikram (Should Pass)' },
        { id: 'CUST007', ask: 1200000, name: 'Rohan (Should Fail DBR)' }
    ];

    for (const flow of flows) {
        console.log(`\n--- TESTING ${flow.name} ---`);
        const session = `test-dbr-${Math.random()}`;

        // 1. Start & Ask for Amount (Start negotiating)
        await chat(session, flow.id, "Hi, I want a personal loan.");

        // 2. Quote Amount (Trigger Needs Doc)
        await chat(session, flow.id, `I need ₹${flow.ask}`);

        // 3. Upload Doc (Trigger Underwriting DBR Check)
        await chat(session, flow.id, "Here is my salary slip.pdf");
    }
}

async function chat(sessionId, customerId, text) {
    try {
        const res = await axios.post('http://localhost:5000/api/chat', {
            message: text,
            sessionId: sessionId,
            mobile: getMobile(customerId)
        }, { responseType: 'text' }); // CRITICAL: Force text handling for stream

        const botResponse = res.data; // It's a string, not JSON
        console.log(`User: ${text}`);
        console.log(`Bot: ${botResponse}`);

        return { response: botResponse };
    } catch (e) {
        console.error("Error Message:", e.message);
        if (e.response) {
            console.error("Server Responded With:", e.response.status, e.response.data);
        } else {
            console.error("No response received.");
        }
    }
}

function getMobile(id) {
    const map = {
        'CUST005': '5555555555',
        'CUST007': '3333333333'
    };
    return map[id];
}

testDBRLogic();
