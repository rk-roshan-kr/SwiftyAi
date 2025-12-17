const { Agent } = require('./framework');
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION (Aligned with products.toon) ---
const INV_PRODUCTS = {
    'FD': {
        id: 'inv_fd_001', // Matches products.toon
        name: 'SteadyGrowth FD',
        rate: 7.10,
        minTenure: 12,
        risk: 'Low',
        desc: 'Guaranteed Returns +0.5% Senior'
    },
    'BOND': {
        id: 'inv_sgb_007', // Using SGB as the Bond proxy from catalog
        name: 'Sovereign Gold Bond',
        rate: 2.50, // + Gold Appreciation
        minTenure: 96, // 8 Years
        risk: 'Medium',
        desc: 'Interest on Gold + No Making Charges'
    },
    'SIP': {
        id: 'inv_mf_eq_005', // Matches products.toon
        name: 'Alpha Aggressive Mutual Fund',
        rate: '12-15%',
        minTenure: 60,
        risk: 'High',
        desc: 'High Growth, Beat Inflation'
    }
};

const INTENT_MAP = {
    "save": "FD", "fd": "FD", "fixed": "FD", "safe": "FD",
    "bond": "BOND", "gold": "BOND", "sgb": "BOND", "growth": "BOND",
    "market": "SIP", "mutual": "SIP", "sip": "SIP", "equity": "SIP"
};

class InvestmentAgent extends Agent {
    constructor() {
        super("InvestmentAgent", "Advises on wealth creation.", []);
        this.cache = { crm: null, catalog: null };
    }

    // --- 2. DATA SYNC (CRM + Catalog) ---
    async ensureDataLoaded() {
        // A. Load CRM (For Balance Checks)
        if (!this.cache.crm) {
            try {
                const crmPath = path.join(__dirname, '../data/mockCRM.json');
                const crmData = await fs.promises.readFile(crmPath, 'utf-8').catch(() => '[]');
                this.cache.crm = JSON.parse(crmData);
            } catch (e) { console.error("[InvAgent] CRM Load Error:", e); }
        }

        // B. Load Catalog (For LLM Context)
        if (!this.cache.catalog) {
            try {
                // Points to D:\EY\products.toon
                const catalogPath = path.join(__dirname, '../../products.toon');
                this.cache.catalog = await fs.promises.readFile(catalogPath, 'utf-8');
            } catch (e) { console.error("[InvAgent] Catalog Load Error:", e.message); }
        }
    }

    // --- 3. DETERMINISTIC NLU ---
    extractEntities(text) {
        const lower = text.toLowerCase();
        const extracted = { intent: null, amount: null, tenure: null, goal: null };

        // Intent Mapping
        for (const [key, val] of Object.entries(INTENT_MAP)) {
            if (lower.includes(key)) { extracted.intent = val; break; }
        }

        // Amount Regex
        const amtMatch = lower.match(/(\d+(\.\d+)?)\s*(k|l|lakh|cr)?/);
        if (amtMatch && !lower.includes('%')) {
            let num = parseFloat(amtMatch[1]);
            const unit = (amtMatch[3] || '').charAt(0);
            if (unit === 'k') num *= 1000;
            else if (unit === 'l') num *= 100000;
            extracted.amount = num > 500 ? num : null;
        }

        // Tenure Regex
        const yearMatch = lower.match(/(\d+)\s*(year|yr)/);
        if (yearMatch) extracted.tenure = parseInt(yearMatch[1]) * 12;

        // Goal Heuristics
        if (lower.includes('retire')) extracted.goal = 'Retirement';
        else if (lower.includes('child') || lower.includes('edu')) extracted.goal = 'Child Education';
        else if (lower.includes('house') || lower.includes('home')) extracted.goal = 'Buying a Home';
        else if (lower.includes('wealth') || lower.includes('rich')) extracted.goal = 'Wealth Creation';

        return extracted;
    }

    // --- 4. THE SMART RUN LOOP ---
    async run(input, context) {
        await this.ensureDataLoaded();
        const userId = context.customerId;
        const nlu = this.extractEntities(input || "");

        // 1. GET FINANCIAL HEALTH (Real-time Balance Check)
        const userProfile = this.cache.crm ? this.cache.crm.find(u => u.customerId === userId) : null;
        const currentBalance = userProfile ? (userProfile.accountBalance || 0) : 0;
        const accountId = userProfile ? userProfile.accountId : "????";

        // HYDRATE STATE
        let state = {
            product: context.productType || nlu.intent || 'FD',
            amount: context.invAmount || nlu.amount || null,
            tenure: context.invTenure || nlu.tenure || null,
            goal: context.invGoal || nlu.goal || null,
            step: context.invStep || 'DISCOVERY'
        };

        if (nlu.intent) state.product = nlu.intent;
        if (nlu.amount) state.amount = nlu.amount;
        if (nlu.tenure) state.tenure = nlu.tenure;
        if (nlu.goal) state.goal = nlu.goal;

        const config = INV_PRODUCTS[state.product];

        // --- 5. INTELLIGENCE ENGINE ---
        let strategyPrompt = "";
        let diagramTrigger = "";

        // SCENARIO A: DISCOVERY (Empathy First)
        if (!state.goal) {
            strategyPrompt = `User hasn't stated a goal. Do not pitch numbers yet.
            Ask: "To give you the best advice, I need to know what you are saving for. Is this for Retirement, a Dream Home, or an Emergency Fund?"
            Mention: "I see you have a healthy balance in account ..${accountId.toString().slice(-4)}, let's put it to work."`;
            state.step = 'DISCOVERY';
            diagramTrigger = "";
        }

        // SCENARIO B: UPSELL LOGIC (The "Advisory" Layer)
        else if (state.step !== 'LOCKED') {

            // 1. BALANCE CHECK (Safety Brake)
            // Prevent users from investing more than they have
            if (state.amount && state.amount > currentBalance) {
                const safeAmount = Math.floor(currentBalance * 0.8);
                strategyPrompt = `CRITICAL: User wants to invest ₹${state.amount} but only has ₹${currentBalance} in Account ..${accountId.toString().slice(-4)}.
                Politely correct them: "I checked your Savings Account, and the available balance is ₹${currentBalance}. Shall we adjust the investment to ₹${safeAmount} to keep some liquidity?"`;
                state.amount = safeAmount;
            }

            // 2. IDLE CASH UPSELL (Profit Maker)
            // If investing < 20% of balance, push for more
            else if (state.amount && state.amount < (currentBalance * 0.2)) {
                const smartUpsell = Math.floor(currentBalance * 0.5);
                strategyPrompt = `OPPORTUNITY: User is investing ₹${state.amount}, but has ₹${currentBalance} sitting idle.
                Say: "I noticed you have ₹${currentBalance} in your savings earning low interest. 
                To reach your goal of ${state.goal} faster, I recommend investing ₹${smartUpsell} instead. The compounding effect will be significant."
                Push for the ${config.name} at ${config.rate}%.`;

                diagramTrigger = "";
                state.step = 'UPSELL';
            }

            // 3. TENURE UPSELL (Stability Lock)
            else if (!state.tenure || state.tenure < config.minTenure) {
                const years = Math.ceil(config.minTenure / 12);
                strategyPrompt = `User tenure is too short. 
                Say: "For ${state.goal}, short-term volatility is a risk. I strongly recommend locking this for ${years} years to guarantee the ${config.rate}% return."`;

                diagramTrigger = "";
                state.step = 'UPSELL';
            }

            // 4. CLOSE DEAL
            else {
                strategyPrompt = `Plan is solid. 
                Confirm: ₹${state.amount} in ${config.name} for ${state.tenure / 12} Years.
                Action: Ask to "Create Portfolio".`;
                state.step = 'LOCKED';
            }
        }

        // --- 6. EXECUTE LLM ---
        const systemPrompt = `
        ROLE: Senior Wealth Manager (Data-Driven, Empathic)
        PRODUCT: ${config.name} (Rate: ${config.rate})
        CATALOG EXCERPT: ${config.desc}
        
        FINANCIAL CONTEXT:
        - A/C Balance: ₹${currentBalance}
        - User Goal: ${state.goal || "Unknown"}
        
        STRATEGY: ${strategyPrompt}

        RULES:
        1. **Use the Data**: Mention "I checked your balance..." or "Account ..${accountId.toString().slice(-4)}".
        2. **Sell the Dream**: Tie money back to Goal (${state.goal}).
        3. **Visuals**: Insert diagram tag if relevant.
        4. Length: Under 50 words.
        
        OUTPUT JSON: { "response": "text", "status": "NEGOTIATING" | "COMPLETED" }
        `;

        let result = await this.callLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ], 0.3);

        let parsed = { response: "I can help with that.", status: "NEGOTIATING" };
        try {
            parsed = JSON.parse(result.replace(/```json/g, '').replace(/```/g, ''));
        } catch (e) {
            parsed.response = result;
        }

        // Append Diagram if Triggered
        if (diagramTrigger && !parsed.response.includes("[Image")) {
            parsed.response += `\n${diagramTrigger}`;
        }

        // Widget Logic (Show specific card if product selected)
        if ((state.step === 'DISCOVERY' || !parsed.response.includes('||FILTER')) && state.product) {
            parsed.response += ` ||FILTER:${state.product}||`;
        }

        return {
            response: parsed.response,
            status: parsed.status,
            data: {
                productType: state.product,
                invAmount: state.amount,
                invTenure: state.tenure,
                invGoal: state.goal,
                invStep: state.step
            }
        };
    }
}

module.exports = new InvestmentAgent();