const { Agent } = require('./framework');
const salesAgent = require('./salesAgent');
const verificationAgent = require('./verificationAgent');
const underwritingAgent = require('./underwritingAgent');
const sanctionAgent = require('./sanctionAgent');
const supportAgent = require('./supportAgent');
const investmentAgent = require('./InvestmentAgent');
const fs = require('fs');
const path = require('path');
const Chat = require('../models/Chat');

// --- 1. CONFIGURATION ---
const SESSIONS_FILE = path.join(__dirname, '../data/sessions.json');
const AGENT_REGISTRY = {
    'SalesAgent': salesAgent,
    'VerificationAgent': verificationAgent,
    'UnderwritingAgent': underwritingAgent,
    'SanctionAgent': sanctionAgent,
    'SupportAgent': supportAgent,
    'InvestmentAgent': investmentAgent
};

// --- 2. WORKFLOW ---
const WORKFLOW = {
    'SalesAgent': { 'AMOUNT_AGREED': { next: 'VerificationAgent', msg: "_Deal Locked. Moving to Verification..._" } },
    'VerificationAgent': {
        'VERIFIED': { next: 'UnderwritingAgent', msg: "_Identity Confirmed. Analyzing Credit..._" },
        'NEGOTIATION_REOPENED': { next: 'SalesAgent', msg: "_Reopening Application..._" }
    },
    'UnderwritingAgent': {
        'APPROVED_INSTANT': { next: 'SanctionAgent', msg: "_Credit Approved! Preparing Offer..._" },
        'NEEDS_DOCUMENT': { next: 'UnderwritingAgent', msg: "_Please upload the required document._" },
        'REJECTED': { next: null, msg: "_Application Closed._" }
    },
    'SanctionAgent': {
        'COMPLETED': { next: null, msg: null },
        'NEGOTIATION_REOPENED': { next: 'SalesAgent', msg: "_Reopening Application..._" }
    },
    'InvestmentAgent': { 'COMPLETED': { next: 'VerificationAgent', msg: "_Investment Plan Ready. Verifying KYC..._" } }
};

class MasterAgent extends Agent {
    constructor() {
        super("MasterAgent", "Orchestrator", Object.values(AGENT_REGISTRY));
        this.sessionStates = this.loadSessions();
    }

    loadSessions() {
        try { if (fs.existsSync(SESSIONS_FILE)) return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8')); } catch (e) { return {}; }
    }
    persistSession() {
        try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(this.sessionStates, null, 2)); } catch (e) { }
    }
    getOrCreateSession(sessionId, incomingMobile) {
        let state = this.sessionStates[sessionId];
        if (!state || (incomingMobile && state.data?.mobile !== incomingMobile)) {
            state = { activeAgent: null, lastActiveTime: Date.now(), data: { mobile: incomingMobile || 'GUEST' }, history: [] };
            this.sessionStates[sessionId] = state;
        }
        return state;
    }

    // --- 3. RUN LOOP ---
    async run(input, context) {
        const { sessionId, mobile } = context;
        const state = this.getOrCreateSession(sessionId, mobile);
        state.lastActiveTime = Date.now();

        // Check Interrupts
        const lowerInput = (input || "").toLowerCase();
        if (this.checkGlobalInterrupts(lowerInput)) {
            state.activeAgent = 'SupportAgent';
        }

        // BATCH STORAGE
        let newMessagesBatch = [];
        let turnComplete = false;
        let loopCount = 0;

        while (!turnComplete && loopCount < 5) {
            loopCount++;

            // A. Routing & Transfer Message
            let targetAgentName = state.activeAgent;
            if (!targetAgentName) {
                targetAgentName = await this.smartRouter(input || "", state);
                state.activeAgent = targetAgentName;

                // Create Transfer Message
                let transferText = "";
                if (targetAgentName === 'SalesAgent') transferText = "Sure, let me transfer you to a Loan Specialist. 📞";
                else if (targetAgentName === 'InvestmentAgent') transferText = "Connecting you to our Wealth Manager... 📈";
                else if (targetAgentName === 'SupportAgent') transferText = "Connecting you to Client Support... 🎧";
                else if (targetAgentName === 'VerificationAgent') transferText = "I need to verify your identity first. 🔐";
                else if (targetAgentName === 'SanctionAgent') transferText = "Connecting to Sanctioning Desk... 📄";

                if (transferText) {
                    newMessagesBatch.push({
                        sender: 'bot',
                        text: transferText,
                        agentType: 'MasterAgent',
                        timestamp: new Date()
                    });
                }
            }

            // B. Execution
            console.log(`[Master] Handing over to ${state.activeAgent}`);
            const agentInstance = AGENT_REGISTRY[state.activeAgent] || AGENT_REGISTRY['SalesAgent'];
            const agentInput = (loopCount > 1) ? "START_SESSION" : input;

            const result = await agentInstance.run(agentInput, { ...context, ...state.data });
            if (result.data) state.data = { ...state.data, ...result.data };

            // Push Agent Response
            newMessagesBatch.push({
                sender: 'bot',
                text: result.response,
                agentType: state.activeAgent,
                timestamp: new Date()
            });

            // C. Transition
            const transition = WORKFLOW[state.activeAgent]?.[result.status];
            if (transition) {
                if (transition.msg) {
                    newMessagesBatch.push({ sender: 'bot', text: transition.msg, agentType: 'MasterAgent', timestamp: new Date() });
                }
                state.activeAgent = transition.next;
                if (!state.activeAgent) turnComplete = true;
            } else {
                turnComplete = true;
            }
        }

        // --- D. SAVE TO DB ---
        // We must save the USER message too, otherwise it disappears on refresh!
        const userMsgObj = {
            id: Date.now().toString() + '_user',
            text: input || context.message || "", // Ensure we capture the input
            sender: 'user',
            timestamp: new Date()
        };

        await Chat.findOneAndUpdate({ sessionId }, {
            $set: { sessionContext: state, activeAgent: state.activeAgent, lastActive: new Date() },
            $push: { messages: { $each: [userMsgObj, ...newMessagesBatch] } }
        }, { upsert: true });

        this.persistSession();

        return {
            response: newMessagesBatch.map(m => m.text).join("\n\n"),
            messages: newMessagesBatch,
            status: 'COMPLETED',
            data: state.data
        };
    }

    checkGlobalInterrupts(msg) {
        const lower = msg.toLowerCase();
        return lower.includes('balance') ||
            lower.includes('complaint') ||
            lower.includes('talk to human') ||
            lower.includes('wrong transaction') ||
            lower.includes('stop') ||
            lower.includes('support');
    }

    async smartRouter(message, state) {
        const lower = message.toLowerCase();

        // 1. Keyword Optimization (Broken into cleaner blocks to avoid syntax errors)

        // Investment
        if (lower.includes('invest') || lower.includes('fd') || lower.includes('sip') || lower.includes('mutual') || lower.includes('taxshield') || lower.includes('save')) {
            return 'InvestmentAgent';
        }

        // Sales (Loans)
        if (lower.includes('loan') || lower.includes('borrow') || lower.includes('money') || lower.includes('personal') || lower.includes('car')) {
            return 'SalesAgent';
        }

        // Verification (KYC)
        if (lower.includes('kyc') || lower.includes('document') || lower.includes('upload')) {
            return 'VerificationAgent';
        }

        // Sanction / Download
        if (lower.includes('sanction') || lower.includes('letter') || lower.includes('download') || lower.includes('pdf')) {
            return 'SanctionAgent';
        }

        // Support / Errors
        if (lower.includes('status') || lower.includes('application') || lower.includes('block') || lower.includes('lost')) {
            return 'SupportAgent';
        }
        if (lower.includes('dispute') || lower.includes('fraud') || lower.includes('wrong') || lower.includes('email')) {
            return 'SupportAgent';
        }
        if (lower.includes('address') || lower.includes('update') || lower.includes('balance') || lower.includes('complaint')) {
            return 'SupportAgent';
        }

        // 2. Contextual Fallback
        if (state.data?.productType) {
            if (['FD', 'BOND', 'SIP'].includes(state.data.productType)) return 'InvestmentAgent';
            return 'SalesAgent';
        }

        // 3. Default
        return 'SalesAgent';
    }
}

module.exports = new MasterAgent();