const masterAgent = require('../agents/masterAgent');

async function testFlow() {
    const sessionId = `test-${Date.now()}`;
    const context = { sessionId, mobile: '9999999999' }; // Matches CUST001

    console.log("--- TEST START ---");

    // 1. Initial Greeting
    console.log("\nUser: I want a loan");
    let res = await masterAgent.run("I want a loan", context);
    console.log("Bot:", res.response);
    console.log("State:", res.status);

    // 2. Negotiate Amount (Within limit 500k)
    console.log("\nUser: I need 500000");
    res = await masterAgent.run("I need 500000", context);
    console.log("Bot:", res.response);
    console.log("State:", res.status);

    // 3. Reset and Try High Amount (Over limit to trigger docs)
    const sessionId2 = `test-high-${Date.now()}`;
    const context2 = { sessionId: sessionId2, mobile: '9999999999' };

    console.log("\n--- TEST 2 START (High Value) ---");
    console.log("\nUser: I want a loan");
    await masterAgent.run("I want a loan", context2);

    console.log("\nUser: I need 800000");
    // Limit is 500k. 800k is < 2x (1M). So should trigger 'NEEDS_DOCUMENT'.
    res = await masterAgent.run("I need 800000", context2);
    console.log("Bot:", res.response);
    console.log("State:", res.status); // Should be NEEDS_DOCUMENT (or mapped state in MasterAgent)

    if (res.response.includes('upload')) {
        console.log("\nUser: Here is my slip.pdf");
        res = await masterAgent.run("Here is my slip.pdf", context2);
        console.log("Bot:", res.response);
    }
}

testFlow().catch(console.error);
