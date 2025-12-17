const { Agent } = require('./framework');
const Loan = require('../models/loan'); // [NEW] Import the Model

class SanctionAgent extends Agent {
    constructor() {
        super("SanctionAgent", "Confirms terms and generates letter.", []);
    }

    formatCurrency(num) {
        if (!num || isNaN(num)) return "Unknown";
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
    }

    async run(input, context) {
        const step = context.sanctionStep || 'INIT';
        const lowerInput = (input || "").toLowerCase();

        // ... [Keep existing Math Logic for EMI/Amount] ...
        const amount = context.requestedAmount || 500000;
        const rate = context.agreedRate || 12.0;
        const tenure = context.requestedTenure || 60;
        const product = context.productType || "PERSONAL";
        const appId = context.applicationId || "TEMP-" + Date.now();

        // Calculate EMI...
        const monthlyRate = rate / 12 / 100;
        const emi = Math.floor((amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1));

        // ... [Keep existing Global Handlers] ...

        // ---------------------------------------------------------
        // [NEW] SAVE TO DATABASE LOGIC (Triggered on 'Done'/'Thanks')
        // ---------------------------------------------------------
        if (step === 'LETTER_ISSUED') {
            if (lowerInput.includes('done') || lowerInput.includes('accept') || lowerInput.includes('thanks') || lowerInput.includes('close')) {

                try {
                    // Check if loan already exists to prevent duplicates
                    const existing = await Loan.findOne({ applicationId: appId });

                    if (!existing) {
                        await Loan.create({
                            applicationId: appId,
                            userId: context.mobile || "GUEST",
                            productType: product,
                            amount: amount,
                            interestRate: rate,
                            tenureMonths: tenure,
                            emi: emi,
                            status: 'ACTIVE',
                            disbursalDate: new Date()
                        });
                        console.log(`[DB] Loan ${appId} saved to database.`);
                    }

                    return {
                        response: `Success! The loan (Ref: ${appId}) has been booked in our core banking system. Funds will be credited shortly. ||WIDGET:CLOSE||`,
                        status: "COMPLETED",
                        data: { sanctionStep: 'COMPLETED', loanBooked: true }
                    };

                } catch (e) {
                    console.error("DB Error:", e);
                    return {
                        response: "The letter is accepted, but I had a glitch connecting to the core system. Tech support has been notified.",
                        status: "COMPLETED",
                        data: { sanctionStep: 'COMPLETED' }
                    };
                }
            }
        }

        // ... [Keep the rest of the file (INIT, WAITING_CONFIRMATION logic)] ...
        // (Use the code from previous steps for the rest)

        // Just ensure this block handles the save before returning the standard response
        return {
            response: "The letter is ready. Download it or say **'I accept'** to finish. ||WIDGET:SANCTION_LETTER||",
            status: "AWAITING_INPUT",
            data: {
                sanctionStep: 'LETTER_ISSUED',
                sanctionDetails: {
                    amount: this.formatCurrency(amount),
                    rate: rate,
                    name: context.name || "Valued Customer",
                    date: new Date().toLocaleDateString()
                }
            }
        };
    }
}

module.exports = new SanctionAgent();