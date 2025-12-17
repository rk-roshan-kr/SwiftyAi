const { Agent } = require('./framework');
const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION ---
const PRODUCT_CONFIG = {
    'PERSONAL': {
        id: 'PL', name: 'Flexi-Cash Personal Loan',
        minRate: 10.50, listRate: 12.00, defaultTenure: 48,
        minAmount: 50000, maxAmount: 5000000,
        requiresCollateral: false,
        desc: "Unsecured loan. No collateral needed."
    },
    'CAR': {
        id: 'VL', name: 'Velocity Drive Car Loan',
        minRate: 8.50, listRate: 9.50, defaultTenure: 60,
        minAmount: 100000, maxAmount: 10000000,
        requiresCollateral: true,
        desc: "Secured car loan. Up to 100% on-road funding."
    },
    'HOME': {
        id: 'HL', name: 'DreamNest Home Loan',
        minRate: 8.35, listRate: 9.00, defaultTenure: 240,
        minAmount: 500000, maxAmount: 100000000,
        requiresCollateral: true,
        desc: "Long-term financing. Tax benefits available."
    }
};

const INTENT_MAP = {
    "car": "CAR", "auto": "CAR", "vehicle": "CAR",
    "personal": "PERSONAL", "cash": "PERSONAL", "travel": "PERSONAL",
    "home": "HOME", "house": "HOME", "flat": "HOME"
};

const TIME_WORDS = { 'couple': 2, 'few': 3, 'decade': 10, 'half a decade': 5, 'dozen': 12 };

class SalesAgent extends Agent {
    constructor() {
        super("SalesAgent", "Negotiates loan terms.", []);
        this.cache = { catalog: null };
    }

    async ensureDataLoaded() {
        if (!this.cache.catalog) {
            try { this.cache.catalog = JSON.stringify(PRODUCT_CONFIG); } catch (e) { }
        }
    }

    formatCurrency(num) {
        if (!num || isNaN(num)) return "Unknown";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
    }

    generateAppId(productType) {
        // Use ID prefix from Config
        const prefix = PRODUCT_CONFIG[productType]?.id || 'LN';
        return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // --- 2. MATH ENGINE ---

    parseRawNumber(str) {
        if (!str) return 0;
        const lower = str.toLowerCase();
        const match = lower.match(/(\d+(\.\d+)?)/);
        if (!match) return 0;
        let val = parseFloat(match[1]);
        if (lower.includes('k')) val *= 1000;
        else if (lower.includes('l')) val *= 100000;
        else if (lower.includes('c')) val *= 10000000;
        return val;
    }

    calculateEMI(principal, rate, months) {
        if (!principal || !rate || !months) return 0;
        const r = rate / 12 / 100;
        return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
    }

    // [FIX] Calculates Total Interest correctly (Amortization based)
    calculateLoanSummary(principal, rate, months) {
        const emi = this.calculateEMI(principal, rate, months);
        const totalPayable = emi * months;
        const totalInterest = totalPayable - principal;
        return { emi, totalPayable, totalInterest };
    }

    calculateMaxLoanFromEMI(targetEMI, rate, months) {
        const r = rate / 12 / 100;
        return Math.round(targetEMI * (Math.pow(1 + r, months) - 1) / (r * Math.pow(1 + r, months)));
    }

    extractEntities(text) {
        const lower = text.toLowerCase();
        const extracted = {
            intent: null, amount: null, targetRate: null,
            mathLogic: null, targetEMI: null, tenure: null,
            askTotalInterest: false, currencyError: false
        };

        // A. Intent
        for (const [key, val] of Object.entries(INTENT_MAP)) {
            if (lower.includes(key)) { extracted.intent = val; break; }
        }

        // B. Currency Guard
        if (lower.includes('usd') || lower.includes('dollar') || lower.includes('euro')) {
            extracted.currencyError = true;
            return extracted;
        }

        // C. Rate
        const rateMatch = lower.match(/(\d+(\.\d+)?)%/);
        if (rateMatch && (lower.includes('interest') || lower.includes('rate'))) {
            extracted.targetRate = parseFloat(rateMatch[1]);
        }

        // D. Target EMI
        if (lower.includes('month') || lower.includes('emi')) {
            const emiMatch = text.match(/(?<![\w-])(\d+(\.\d+)?)\s*(k|l)?/i);
            if (emiMatch) {
                let val = parseFloat(emiMatch[1]);
                if ((emiMatch[3] || '').toLowerCase() === 'k') val *= 1000;
                if (val < 500000) extracted.targetEMI = val;
            }
        }

        // E. Tenure
        const explicitTenure = lower.match(/(\d+)\s*(year|yr|month|mo)/);
        if (explicitTenure) {
            let val = parseInt(explicitTenure[1]);
            if (explicitTenure[2].startsWith('y')) val *= 12;
            extracted.tenure = val;
        } else {
            for (const [word, val] of Object.entries(TIME_WORDS)) {
                if (lower.includes(word) && (lower.includes('year') || lower.includes('yr'))) {
                    extracted.tenure = val * 12;
                    break;
                }
            }
        }

        // F. "How much interest?" check
        if (lower.includes('total interest') || lower.includes('how much interest') || lower.includes('paying')) {
            extracted.askTotalInterest = true;
        }

        // G. Standard Amount (Enhanced Regex)
        if (!extracted.amount && !extracted.targetEMI) {
            // Regex handles: 5L, 5 Lakh, 5 Cr, 50000, 50k, 50 Rupees, Rs 50000
            const numRegex = /(?<![\w-])(\d+(\.\d+)?)\s*(k|l|lakh|cr|crore|rs|rupees)/gi;
            const numbers = [];
            let m;
            while ((m = numRegex.exec(text)) !== null) {
                // Also parse plain numbers if they are large enough (handled by parseRawNumber logic internally if connected)
                // But specifically matching units here as per intent
                numbers.push(this.parseRawNumber(m[0]));
            }

            // Fallback for plain numbers without units if context implies amount
            if (numbers.length === 0) {
                const simpleMatch = text.match(/(?<![\w-])(\d{4,9})/); // 1000 to 99Cr
                if (simpleMatch) numbers.push(parseFloat(simpleMatch[0]));
            }

            const cleanNumbers = numbers.filter(n => n > 100);
            if (cleanNumbers.length > 0) extracted.amount = Math.max(...cleanNumbers);
        }

        return extracted;
    }

    async run(input, context) {
        await this.ensureDataLoaded();
        const lowerInput = (input || "").toLowerCase();

        // NLU EXTRACTION FIRST
        const nlu = this.extractEntities(input || "");

        // --- 1. GLOBAL INTERRUPTS ---

        // A. Insult Handler
        if (lowerInput.match(/\b(dumb|stupid|bad|math|fail|wrong|idiot|crap)\b/) && !nlu.amount) {
            return {
                response: "I apologize if I caused confusion. I am an AI still learning nuances. Please tell me the **Loan Amount** you need so I can restart properly.",
                status: "NEGOTIATING", data: { negotiationStatus: 'NEGOTIATING' }
            };
        }

        // B. Closing
        if (lowerInput.includes('thank') || lowerInput.includes('bye') || lowerInput.includes('done')) {
            return {
                response: "You're welcome! Ref ID: " + (context.applicationId || "N/A"),
                status: "COMPLETED", data: { negotiationStatus: 'COMPLETED' }
            };
        }

        if (nlu.currencyError) {
            return { response: "We only process loans in INR. Please state amount in Lakhs.", status: "NEGOTIATING", data: {} };
        }

        // --- 2. STATE MANAGEMENT ---
        let state = {
            product: context.productType || 'PERSONAL',
            amount: context.requestedAmount || null,
            rate: context.currentOfferedRate || null,
            tenure: context.requestedTenure || null,
            collateral: context.collateral || null, // [NEW] Track Collateral
            appId: context.applicationId || null,
            rounds: context.negotiationRounds || 0,
            floorHitCount: context.floorHitCount || 0,
            status: context.negotiationStatus || 'NEGOTIATING'
        };

        // Fresh Start Logic
        if ((nlu.intent && nlu.intent !== context.productType) || !state.appId || state.status === 'COMPLETED') {
            state.product = nlu.intent || 'PERSONAL';
            // Use generating ID logic
            state.appId = this.generateAppId(state.product);

            const prodConfig = PRODUCT_CONFIG[state.product];
            state.rate = prodConfig.listRate;
            state.tenure = prodConfig.defaultTenure;
            state.amount = nlu.amount || null;
            state.collateral = null; // Reset collateral
            state.status = 'NEGOTIATING';
            state.rounds = 0;
            state.floorHitCount = 0;
        } else {
            if (nlu.amount) state.amount = nlu.amount;
            if (nlu.tenure) state.tenure = nlu.tenure;
        }

        if (!state.rate) state.rate = PRODUCT_CONFIG[state.product].listRate;
        if (!state.tenure) state.tenure = PRODUCT_CONFIG[state.product].defaultTenure;

        const config = PRODUCT_CONFIG[state.product];
        const floorRate = config.minRate;

        // --- 3. BOUNDARY CHECKS ---
        if (state.amount) {
            if (state.amount < config.minAmount) state.amount = config.minAmount;
            if (state.amount > config.maxAmount) state.amount = config.maxAmount;
        }

        // --- 4. TACTICS & LOGIC ---
        let negotiationTactic = "standard";
        let salesInstruction = "";

        // FINANCIALS
        const loanMath = this.calculateLoanSummary(state.amount, state.rate, state.tenure);
        const years = Math.round(state.tenure / 12 * 10) / 10;

        // SCENARIO: DISCOVERY (Amount Missing)
        if (!state.amount) {
            negotiationTactic = "discovery";
            salesInstruction = `New App ${state.appId}. Ask "How much funds do you require?"`;
        }
        // SCENARIO: COLLATERAL CHECK (New Feature)
        else if (config.requiresCollateral && !state.collateral) {
            // Check if user provided it in this turn
            if (input.length > 3 && !nlu.amount && !nlu.intent) {
                // Simple Heuristic: If we asked for collateral and they typed something non-numeric, assume it is collateral
                // Ideally we'd use NLU, but this is a rough latch
                state.collateral = input;
                // Re-evaluate logic immediately (recursive-ish) or just proceed to offer in next turn
                // For now, let's fall through to offer if we captured it, OR ask if we didn't (which we won't know until next turn effectively unless we do it here)
                // Let's assume we accepted it and move to offer
                negotiationTactic = "standard"; // Proceed to offer
                salesInstruction = `Collateral '${state.collateral}' noted. Offer: ${this.formatCurrency(state.amount)} at ${state.rate}%. Ask to proceed.`;
            } else {
                negotiationTactic = "request_collateral";
                const assetType = state.product === 'CAR' ? "car model" : "property location";
                salesInstruction = `Acknowledge amount ${this.formatCurrency(state.amount)}. Ask: "Which ${assetType} are you purchasing?"`;
            }
        }
        // SCENARIO: TOTAL INTEREST QUESTION
        else if (nlu.askTotalInterest) {
            negotiationTactic = "math_explanation";
            salesInstruction = `User asked interest. State: "For ${this.formatCurrency(state.amount)} @ ${state.rate}% (${years} yrs): Monthly EMI: ${this.formatCurrency(loanMath.emi)}, Total Interest: ${this.formatCurrency(loanMath.totalInterest)}". Ask to proceed.`;
        }
        // SCENARIO: ACTIVE NEGOTIATION
        else if (state.status !== 'LOCKED') {
            const isResistance = nlu.targetRate || lowerInput.includes('lower') || lowerInput.includes('expensive');

            if (isResistance) {
                if (state.status === 'OFFER_ACCEPTED') state.status = 'NEGOTIATING';
                state.rounds++;

                if (nlu.targetRate) {
                    if (nlu.targetRate >= floorRate) {
                        state.rate = nlu.targetRate;
                        negotiationTactic = "accept_target";
                    } else {
                        state.rate = floorRate;
                        state.floorHitCount++;
                        negotiationTactic = "hard_floor";
                    }
                } else {
                    const step = (state.rate - floorRate > 1.0) ? 0.5 : 0.25;
                    const newRate = Math.max(floorRate, state.rate - step);
                    state.rate = newRate;
                    negotiationTactic = (newRate <= floorRate) ? "hard_floor" : "step_down";
                }
            }
            // Strict Locking
            else if (lowerInput.match(/\b(deal|lock|documentation|sign|submit)\b/)) {
                state.status = 'LOCKED';
                negotiationTactic = "closing";
            }
            // Agreement
            else if (lowerInput.match(/\b(yes|ok|okay|sure|proceed)\b/)) {
                if (state.status !== 'OFFER_ACCEPTED') {
                    state.status = 'OFFER_ACCEPTED';
                    negotiationTactic = "ask_confirmation";
                } else {
                    state.status = 'LOCKED';
                    negotiationTactic = "closing";
                }
            }
            else {
                // Default Offer
                salesInstruction = `Offer: ${this.formatCurrency(state.amount)} at ${state.rate}% for ${years} years. EMI: ${this.formatCurrency(loanMath.emi)}. Ask if this fits.`;
            }
        }
        else if (state.status === 'LOCKED') {
            salesInstruction = `Deal locked. Transferring...`;
        }

        // --- 5. PROMPT GENERATION ---
        if (!salesInstruction) {
            const emi = this.formatCurrency(loanMath.emi);

            if (negotiationTactic === "accept_target")
                salesInstruction = `Agreed. Matching ${state.rate}% for ${years} years. EMI: ${emi}. Lock?`;
            else if (negotiationTactic === "step_down")
                salesInstruction = `Special rate: ${state.rate}% for ${years} years. EMI: ${emi}. Better?`;
            else if (negotiationTactic === "hard_floor")
                salesInstruction = `${state.rate}% is floor. EMI: ${emi}. Proceed?`;
            else if (negotiationTactic === "ask_confirmation")
                salesInstruction = `Say: "Excellent! Locked ${state.rate}% for ${this.formatCurrency(state.amount)} (${years} yrs, EMI: ${emi}). Documentation?"`;
            else if (negotiationTactic === "closing")
                salesInstruction = `Say: "Perfect. Initiating verification for App ID ${state.appId}..."`;
        }

        const systemPrompt = `
        ROLE: Loan Officer
        DATA: Rate=${state.rate}%, Tenure=${years} yrs, EMI=${this.formatCurrency(loanMath.emi)}, Collateral=${state.collateral || 'N/A'}
        INSTRUCTION: ${salesInstruction}

        RULES:
        1. Concise.
        2. ${negotiationTactic === 'request_collateral' ? 'Ask for collateral details.' : 'Mention Tenure.'}
        3. If "ask_confirmation", end with "Shall we get down to documentation?".
        4. OUTPUT VALID JSON ONLY.

        OUTPUT: { "response": "text", "status": "NEGOTIATING" | "AMOUNT_AGREED" }
        `;

        let result = await this.callLLM([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
        ], 0.2);

        let parsed = { response: "Let's discuss terms.", status: "NEGOTIATING" };

        try {
            const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstBrace = clean.indexOf('{');
            const lastBrace = clean.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
            } else {
                if (clean.includes("ROLE:") || clean.includes("INSTRUCTION:")) {
                    parsed.response = "Offer updated. Proceed?";
                } else {
                    parsed.response = clean;
                }
            }
        } catch (e) {
            parsed.response = "Offer updated. Proceed?";
        }

        if (state.status === 'LOCKED') parsed.status = 'AMOUNT_AGREED';
        if (state.status === 'OFFER_ACCEPTED') parsed.status = "NEGOTIATING";

        // Filter Tagging
        if (!parsed.response.includes("||FILTER") && state.amount && state.status !== 'LOCKED') {
            parsed.response += ` ||FILTER:${state.product}||`;
        }

        return {
            response: parsed.response,
            status: parsed.status,
            data: {
                productType: state.product,
                requestedAmount: state.amount,
                currentOfferedRate: state.rate,
                requestedTenure: state.tenure,
                collateral: state.collateral, // [NEW] Pass Collateral
                agreedRate: state.status === 'LOCKED' ? state.rate : null,
                applicationId: state.appId,
                negotiationRounds: state.rounds,
                floorHitCount: state.floorHitCount,
                negotiationStatus: state.status
            }
        };
    }
}

module.exports = new SalesAgent();