const { Agent } = require('./framework');
const fs = require('fs');
const path = require('path');

class VerificationAgent extends Agent {
    constructor() {
        super("VerificationAgent", "Verifies Identity and Bank Details.", []);
    }

    async run(input, context) {
        const step = context.kycStep || 'INIT';
        const lowerInput = (input || "").toLowerCase();

        // --- GLOBAL INTERRUPTS ---
        // Escape Hatch: User wants to change loan details
        if (lowerInput.includes('wrong') || lowerInput.includes('change amount') || lowerInput.includes('go back')) {
            return {
                response: "I understand. Sending you back to the Loan Specialist to adjust the terms. 🔄",
                status: "NEGOTIATION_REOPENED",
                data: { kycStep: 'INIT' }
            };
        }

        // --- STATE MACHINE ---

        // 1. INITIAL CHECK (DigiLocker)
        if (step === 'INIT' || input === 'START_SESSION') {
            // Check if user has already linked DigiLocker in their "Profile" (Mock check)
            if (context.digiLockerLinked) {
                // If linked, auto-fetch (Happy Path)
                return {
                    response: `I've fetched your details from DigiLocker 🔒.\n\n**Name:** ${context.userName || "Mahesh Kumar"}\n**PAN:** ${context.pan || "ABCDE1234F"}\n\nIs this correct? (Yes/No)`,
                    status: "AWAITING_INPUT",
                    data: { kycStep: 'CONFIRM_IDENTITY' }
                };
            } else {
                // If NOT linked, ask to link or manual input
                return {
                    response: `I see your **DigiLocker is not linked**.\n\nTo proceed, please either:\n1. **Link DigiLocker** in your profile settings.\n2. Or manually type your **PAN Number** and **Aadhaar Number** here.`,
                    status: "AWAITING_INPUT",
                    data: { kycStep: 'AWAITING_DOCS' }
                };
            }
        }

        // 2. MANUAL DOCUMENT INPUT
        if (step === 'AWAITING_DOCS') {
            // Check if user says they linked it
            if (lowerInput.includes('linked') || lowerInput.includes('done') || lowerInput.includes('connected')) {
                return {
                    response: "Great! Retrieving details... Success! ✅\n\n**Name:** Mahesh Kumar\n**Verified via:** DigiLocker\n\nProceeding to Bank Verification...",
                    status: "AWAITING_INPUT",
                    data: { kycStep: 'CHECK_BANK', digiLockerLinked: true, userName: 'Mahesh Kumar' }
                };
            }

            // Regex for PAN (5 Letters, 4 Numbers, 1 Letter)
            const panMatch = input.toUpperCase().match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
            // Regex for Aadhaar (12 Digits)
            const aadhaarMatch = input.match(/\d{12}/);

            if (panMatch && aadhaarMatch) {
                return {
                    response: `Thanks. Verifying **PAN ${panMatch[0]}** and **Aadhaar ending in ${aadhaarMatch[0].slice(-4)}**... \n\n✅ Identity Verified: **Mahesh Kumar**.\n\nNow, checking bank details...`,
                    status: "AWAITING_INPUT",
                    data: {
                        kycStep: 'CHECK_BANK',
                        pan: panMatch[0],
                        aadhaar: aadhaarMatch[0],
                        userName: 'Mahesh Kumar'
                    }
                };
            } else if (panMatch) {
                return { response: "Got the PAN. Now please enter your **12-digit Aadhaar Number**.", status: "AWAITING_INPUT", data: {} };
            } else if (aadhaarMatch) {
                return { response: "Got the Aadhaar. Now please enter your **PAN Number**.", status: "AWAITING_INPUT", data: {} };
            } else {
                return {
                    response: "I couldn't detect valid details. Please enter a valid **PAN** (e.g. ABCDE1234F) and **Aadhaar** (12 digits), or say 'Linked' if you connected DigiLocker.",
                    status: "AWAITING_INPUT",
                    data: {}
                };
            }
        }

        // 3. CONFIRM IDENTITY (If Auto-Fetched)
        if (step === 'CONFIRM_IDENTITY') {
            if (lowerInput.includes('yes') || lowerInput.includes('correct')) {
                return {
                    response: "Identity confirmed. Now checking bank connectivity...",
                    status: "AWAITING_INPUT",
                    data: { kycStep: 'CHECK_BANK' }
                };
            } else {
                return {
                    response: "Apologies. Please manually enter your **PAN** and **Aadhaar** to correct the record.",
                    status: "AWAITING_INPUT",
                    data: { kycStep: 'AWAITING_DOCS' }
                };
            }
        }

        // 4. BANK ACCOUNT CHECK
        if (step === 'CHECK_BANK') {
            // Check if bank is linked (Mock check)
            if (context.bankLinked) {
                return {
                    response: "Active Bank Account found ending in **XX89**. Verification Complete! Sending to Underwriting. 🚀",
                    status: "VERIFIED",
                    data: { kycStep: 'COMPLETED' }
                };
            } else {
                // Force user to link bank
                if (lowerInput.includes('done') || lowerInput.includes('linked') || lowerInput.includes('connected')) {
                    return {
                        response: "Searching for bank account... **Success!** Found HDFC Bank Account linked to your PAN.\n\nVerification Complete! Sending to Underwriting. 🚀",
                        status: "VERIFIED",
                        data: { kycStep: 'COMPLETED', bankLinked: true }
                    };
                }

                return {
                    response: `⚠️ **No Bank Account Linked**\n\nTo receive the loan funds, we need a valid bank account. Please **Connect your Bank Account** in the Profile section.\n\nType **"Done"** once you have linked it.`,
                    status: "AWAITING_INPUT",
                    data: { kycStep: 'CHECK_BANK' } // Stay in this step loop
                };
            }
        }

        return { response: "Verifying...", status: "AWAITING_INPUT", data: {} };
    }
}

module.exports = new VerificationAgent();