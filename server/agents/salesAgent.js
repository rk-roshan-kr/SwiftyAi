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
            askTotalInterest: false, currencyError: false,
            confirmed: false // [NEW] Track explicit confirmation
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
        // Fallback: simple X% match if not caught above
        if (!extracted.targetRate) {
            const simpleRate = lower.match(/(\d+(\.\d+)?)%/);
            if (simpleRate) extracted.targetRate = parseFloat(simpleRate[1]);
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

        // G. Confirmation Detection [NEW]
        if (lower.match(/\b(yes|ok|okay|sure|proceed|deal|lock|sign|submit|agree)\b/)) {
            extracted.confirmed = true;
        }

        // H. Standard Amount (Enhanced Regex)
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
        if (lowerInput.includes('thank') || lowerInput.includes('bye')) {
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
            collateral: context.collateral || null,
            appId: context.applicationId || null,
            rounds: context.negotiationRounds || 0,
            floorHitCount: context.floorHitCount || 0,
            status: context.negotiationStatus || 'NEGOTIATING',
            step: context.negotiationStep || 'DISCOVERY'
        };

        const prodConfig = PRODUCT_CONFIG[state.product];

        // Fresh Start Logic
        if ((nlu.intent && nlu.intent !== context.productType) || !state.appId || state.status === 'COMPLETED') {
            state.product = nlu.intent || 'PERSONAL';
            // Use generating ID logic
            state.appId = this.generateAppId(state.product);

            // Re-fetch config based on possibly new product
            const newConfig = PRODUCT_CONFIG[state.product];
            state.rate = newConfig.listRate;
            state.tenure = newConfig.defaultTenure;
            state.amount = nlu.amount || null; // Capture amount immediately if provided
            state.collateral = null;
            state.status = 'NEGOTIATING';
            state.step = state.amount ? 'QUOTE' : 'DISCOVERY'; // Jump to QUOTE if amount present
            state.rounds = 0;
            state.floorHitCount = 0;
        } else {
            // Update context
            if (nlu.amount) {
                state.amount = nlu.amount;
                // If we get a new amount in QUOTE or LOCKING, we might need to re-quote
                state.step = 'QUOTE';
            }
            if (nlu.tenure) state.tenure = nlu.tenure;
        }

        if (!state.rate) state.rate = PRODUCT_CONFIG[state.product].listRate;
        if (!state.tenure) state.tenure = PRODUCT_CONFIG[state.product].defaultTenure;

        const config = PRODUCT_CONFIG[state.product];
        const floorRate = config.minRate;

        // --- 3. BOUNDARY CHECKS ---
        let clampMessage = "";
        if (state.amount) {
            if (state.amount < config.minAmount) {
                state.amount = config.minAmount;
                clampMessage = `Min amount is ${this.formatCurrency(config.minAmount)}`;
            }
            if (state.amount > config.maxAmount) {
                state.amount = config.maxAmount;
                clampMessage = `Max amount is ${this.formatCurrency(config.maxAmount)}`;
            }
        }

        // --- 4. MULTI-STAGE LATCH LOGIC ---
        let negotiationTactic = "standard";
        let salesInstruction = "";

        // --- STEP SWITCH LOGIC ---
        // If in LOCKING but user is resisting (new rate, not confirmed), fall back to QUOTE
        // This ensures the resistance block below processes the input in the same turn
        if (state.step === 'LOCKING') {
            if (nlu.targetRate || lowerInput.match(/(\d+)%/) || lowerInput.includes('lower')) {
                state.step = 'QUOTE';
            }
        }

        // --- STEP 1: DISCOVERY ---
        if (state.step === 'DISCOVERY') {
            if (!state.amount) {
                salesInstruction = `New App ${state.appId}. Ask usage of funds & "How much funds do you require?"`;
            } else {
                state.step = 'QUOTE'; // Auto-advance
            }
        }

        // --- STEP 2: QUOTE (Negotiation Loop) ---
        // Note: We use 'if' here (not else if) so a fall-through from DISCOVERY/LOCKING works immediately
        if (state.step === 'QUOTE') {
            // COLLATERAL CHECK
            if (config.requiresCollateral && !state.collateral) {
                // If user typed string (not rate/amount), assume collateral
                if (input.length > 3 && !nlu.amount && !nlu.targetRate && !nlu.confirmed) {
                    state.collateral = input;
                } else {
                    negotiationTactic = "request_collateral";
                    const assetType = state.product === 'CAR' ? "car model" : "property location";
                    salesInstruction = `Acknowledge amount ${this.formatCurrency(state.amount)}. Ask: "Which ${assetType} are you purchasing?"`;
                }
            }

            // If we have collateral (or don't need it), proceed to Price Negotiation
            if (!salesInstruction) {
                const isResistance = nlu.targetRate || lowerInput.includes('lower') || lowerInput.includes('expensive');

                if (isResistance) {
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

                // USER SIGNALS MOVING FORWARD
                if (nlu.confirmed || lowerInput.includes('proceed') || lowerInput.includes('lock')) {
                    // Check if this was a resistance turn (e.g. "10%"). If so, don't lock immediately unless they said "Yes 10%".
                    if (nlu.targetRate && nlu.confirmed) {
                        state.step = 'LOCKING';
                        negotiationTactic = 'ask_confirmation';
                    } else if (!isResistance) {
                        // Only lock if we aren't currently fighting over rate
                        state.step = 'LOCKING';
                        negotiationTactic = 'ask_confirmation';
                    }
                }

                if (state.step === 'QUOTE' && !salesInstruction) {
                    // Standard Offer Presentation
                    const prefix = clampMessage ? `(${clampMessage}) ` : "";
                    const loanMath = this.calculateLoanSummary(state.amount, state.rate, state.tenure);
                    salesInstruction = `${prefix}Offer: ${this.formatCurrency(state.amount)} at ${state.rate}% for ${Math.round(state.tenure / 12 * 10) / 10} years. EMI: ${this.formatCurrency(loanMath.emi)}. Ask if this fits.`;
                }
            }
        }

        // --- STEP 3: LOCKING (Explicit Confirmation) ---
        if (state.step === 'LOCKING') {
            // Calculate final math
            const loanMath = this.calculateLoanSummary(state.amount, state.rate, state.tenure);
            const years = Math.round(state.tenure / 12 * 10) / 10;

            // If user just got moved here, we need to ask for confirmation
            if (negotiationTactic === 'ask_confirmation') {
                // Soften "Locked" to "Drafted offer"
                salesInstruction = `Say: "Excellent! I have drafted an offer: ${state.rate}% for ${this.formatCurrency(state.amount)} (${years} yrs, EMI: ${this.formatCurrency(loanMath.emi)}). Shall we proceed to documentation?"`;
            } else {
                // User is replying to the "Documentation?" question
                if (nlu.confirmed) {
                    state.status = 'LOCKED'; // Internal status
                    negotiationTactic = "closing";
                } else {
                    // User hesitated? Back to QUOTE
                    state.step = 'QUOTE';
                    salesInstruction = `Understood. What part of the offer would you like to change? Rate is ${state.rate}%.`;
                }
            }
        }

        // --- 5. PROMPT GENERATION ---
        const loanMath = this.calculateLoanSummary(state.amount, state.rate, state.tenure);
        const years = Math.round(state.tenure / 12 * 10) / 10;
        const emi = this.formatCurrency(loanMath.emi);

        if (!salesInstruction) {
            if (negotiationTactic === "accept_target")
                salesInstruction = `Agreed. Deal: ${state.rate}% for ${years} years. EMI: ${emi}. Shall we proceed?`;
            else if (negotiationTactic === "step_down")
                salesInstruction = `Counter-offer: ${state.rate}% for ${years} years. EMI: ${emi}. Is this acceptable?`;
            else if (negotiationTactic === "hard_floor")
                salesInstruction = `Best I can do is ${state.rate}%. EMI: ${emi}. Do we have a deal?`;
            else if (negotiationTactic === "closing")
                salesInstruction = `Say: "Perfect. Initiating verification for App ID ${state.appId}..."`;
        }

        const systemPrompt = `
        You are a helpful Loan Officer at Swifty AI.
        CONTEXT: Step=${state.step}, Rate=${state.rate}%, Tenure=${years} yrs, EMI=${emi}, Collateral=${state.collateral || 'N/A'}
        
        YOUR GOAL:
        ${salesInstruction}

        GUIDELINES:
        1. Keep response concise and natural.
        2. ${negotiationTactic === 'request_collateral' ? 'Ask for collateral details.' : 'Mention Tenure.'}
        3. If instruction says "Drafted offer", end with "Shall we get down to documentation?".
        4. OUPUT RAW JSON: { "response": "text", "status": "NEGOTIATING" | "AMOUNT_AGREED" }
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
                parsed.response = clean;
            }
        } catch (e) {
            parsed.response = "Offer updated. Proceed?";
        }

        // FORCE OVERRIDE STATUS BASED ON LOGIC GUARD
        if (state.status === 'LOCKED') {
            parsed.status = 'AMOUNT_AGREED';
        } else {
            parsed.status = 'NEGOTIATING'; // Prevent LLM hallucinations
        }

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
                collateral: state.collateral,
                agreedRate: state.status === 'LOCKED' ? state.rate : null,
                applicationId: state.appId,
                negotiationRounds: state.rounds,
                floorHitCount: state.floorHitCount,
                negotiationStatus: state.status,
                negotiationStep: state.step
            }
        };
    }
}

module.exports = new SalesAgent();