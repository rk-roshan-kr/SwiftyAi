const { Agent } = require('./framework');
const fs = require('fs');
const path = require('path');

class UnderwritingAgent extends Agent {
    constructor() {
        super("UnderwritingAgent", "Fetches Credit Score & Income Analysis.", []);
    }

    async run(input, context) {
        const step = context.underwritingStep || 'INIT';
        const lowerInput = (input || "").toLowerCase();

        // 1. DATA LOADING (Mock CIBIL)
        let cibilRecord = null;
        try {
            const dbPath = path.join(__dirname, '../data/mockCIBIL.json');
            const cibilDB = JSON.parse(await fs.promises.readFile(dbPath, 'utf-8').catch(() => '[]'));
            cibilRecord = cibilDB.find(r => r.pan === context.pan) || cibilDB[0];
        } catch (e) { console.error("[Underwriting] CIBIL DB Error", e); }

        const score = cibilRecord ? cibilRecord.score : 750;

        // 2. INTERACTION FLOW

        // STEP A: ASK PERMISSION
        if (step === 'INIT' || input === 'START_SESSION') {
            return {
                response: `To process your loan, I need to check your **CIBIL Score** and **Income Eligibility**.
                
                This will be a "Soft Inquiry". Do I have your permission?`,
                status: "AWAITING_INPUT",
                data: { underwritingStep: 'WAITING_CONSENT' }
            };
        }

        // STEP B: CHECK SCORE -> ASK INCOME
        if (step === 'WAITING_CONSENT') {
            if (lowerInput.includes('yes') || lowerInput.includes('ok') || lowerInput.includes('go')) {
                // Check Score First
                if (score < 700) {
                    return {
                        response: `I found your score is **${score}**, which is below our threshold of 700. Unfortunately, we cannot proceed.`,
                        status: "REJECTED",
                        data: { underwritingStep: 'REJECTED' }
                    };
                }

                // If Score OK, Ask Income
                return {
                    response: `**CIBIL Score:** ${score} (Excellent) ✅
                    
                    One last check: What is your **Monthly Net Salary**?`,
                    status: "AWAITING_INPUT",
                    data: { underwritingStep: 'CHECK_INCOME' }
                };
            } else {
                return { response: "I cannot proceed without permission.", status: "COMPLETED", data: {} };
            }
        }

        // STEP C: INCOME CHECK & FINAL DECISION
        if (step === 'CHECK_INCOME') {
            const salaryMatch = input.match(/(\d+(\.\d+)?)\s*(k|l|lakh)?/i);

            if (salaryMatch) {
                let salary = parseFloat(salaryMatch[1]);

                // [FIX] Exclusive Scaling prevents 40L -> 400Cr bug
                if (lowerInput.includes('l') || lowerInput.includes('lakh')) {
                    salary *= 100000;
                } else if (lowerInput.includes('k')) {
                    salary *= 1000;
                }

                // LOGIC: DTI Check
                // Estimate EMI ~ 2% of Loan Amount (Mock)
                const loanAmount = context.requestedAmount || 500000;
                const estimatedEMI = loanAmount * 0.02;
                const dti = estimatedEMI / salary;

                console.log(`[Underwriting] Salary: ${salary}, Est. EMI: ${estimatedEMI}, DTI: ${dti}`);

                if (salary < 15000) {
                    return {
                        response: `I'm sorry. Based on the declared income of ₹${salary}, you do not meet the minimum income criteria (₹15,000). Application Rejected.`,
                        status: "REJECTED",
                        data: { underwritingStep: 'COMPLETED' }
                    };
                }

                if (dti > 0.60) {
                    return {
                        response: `Risk Alert: The estimated EMI for ₹${loanAmount} is too high for your reported income. 
                        
                        I am sending you back to Sales to **reduce the loan amount**.`,
                        status: "NEGOTIATION_REOPENED",
                        data: { underwritingStep: 'INIT' }
                    };
                }

                // APPROVED
                return {
                    response: `**Financial Analysis Passed** ✅
                    - CIBIL: ${score}
                    - Income Verified: ₹${salary}
                    - Risk: Low
                    
                    Generating Sanction Letter...`,
                    status: "APPROVED_INSTANT",
                    data: { underwritingStep: 'COMPLETED', verifiedIncome: salary }
                };
            }
            return { response: "Please enter a valid monthly salary (e.g. 50000).", status: "AWAITING_INPUT", data: {} };
        }

        return { response: "Verifying...", status: "AWAITING_INPUT", data: {} };
    }
}

module.exports = new UnderwritingAgent();