const { Agent } = require('./framework');
const fs = require('fs');
const path = require('path');
const Loan = require('../models/loan'); // [NEW] Added Loan Model

class SupportAgent extends Agent {
    constructor() {
        super("SupportAgent", "Handles Balance, Statements, Card Blocking, Disputes, and Profile Updates.", []);
        this.cache = { crm: null };
    }

    async ensureDataLoaded() {
        if (this.cache.crm) return;
        try {
            const crm = await fs.promises.readFile(path.join(__dirname, '../data/mockCRM.json'), 'utf-8').catch(() => '[]');
            this.cache.crm = JSON.parse(crm);
        } catch (e) { console.error("[Support] CRM Error", e); }
    }

    async run(input, context) {
        await this.ensureDataLoaded();
        const step = context.supportStep || 'INIT';
        const lowerInput = (input || "").toLowerCase();

        // 1. IDENTIFY USER
        const account = this.cache.crm ? this.cache.crm.find(a => a.customerId === context.customerId) : null;

        // [NOTE] For demo purposes, if no CRM account found, we create a dummy one so the agent doesn't crash
        const userAccount = account || {
            type: 'Savings',
            accountId: 'XXXXXX1234',
            balance: 245000,
            cardLast4: '8899',
            recentTransactions: [{ amount: 1200, desc: 'Amazon' }]
        };

        // --- GLOBAL: HUMAN HANDOVER ---
        if (lowerInput.includes('manager') || lowerInput.includes('human') || lowerInput.includes('complaint')) {
            return {
                response: "I understand this requires human attention. I am connecting you to a Senior Relationship Manager. Current wait time: 2 minutes. ||WIDGET:CONNECTING_ANIMATION||",
                status: "HANDOVER_TO_HUMAN",
                data: {}
            };
        }

        // --- GLOBAL: STATUS CHECK (The "Real DB" Logic) ---
        // Checks for patterns like "Status of PL-12345" or just "Status"
        const refMatch = input.match(/[A-Z]{2,3}-?\d{6}/i);
        if (lowerInput.includes('status') || refMatch) {
            if (refMatch) {
                const appId = refMatch[0].toUpperCase();
                try {
                    const loan = await Loan.findOne({ applicationId: appId });
                    if (!loan) {
                        return { response: `I couldn't find application **${appId}**. Please check the ID.`, status: "COMPLETED", data: {} };
                    }
                    let msg = `**App:** ${appId}\n**Status:** ${loan.status}`;
                    if (loan.status === 'DISBURSED') msg += `\n**Disbursed:** ${loan.disbursalDate ? loan.disbursalDate.toLocaleDateString() : 'Today'}`;
                    else msg += `\n**Pending:** Underwriting`;
                    return { response: msg, status: "COMPLETED", data: {} };
                } catch (e) { return { response: "System Error.", status: "COMPLETED", data: {} }; }
            } else if (step === 'INIT' && !lowerInput.includes('balance')) {
                // If they asked for status but didn't give ID
                return { response: "Please provide your **Application Reference Number** (e.g. PL-123456).", status: "AWAITING_INPUT", data: {} };
            }
        }

        // ---------------------------------------------------------
        // INTENT 1: BALANCE CHECK
        // ---------------------------------------------------------
        if (step === 'INIT' && (lowerInput.includes('balance') || lowerInput.includes('how much'))) {
            return {
                response: `I can show your balance. Just to be safe, please confirm you want to view the balance for: **${userAccount.type} Account (..${userAccount.accountId.slice(-4)})**?`,
                status: "AWAITING_INPUT",
                data: { supportStep: 'CONFIRM_BALANCE' }
            };
        }
        if (step === 'CONFIRM_BALANCE') {
            if (lowerInput.includes('yes') || lowerInput.includes('ok')) {
                return { response: `Your Balance: **₹${userAccount.balance.toLocaleString('en-IN')}**`, status: "COMPLETED", data: { supportStep: 'INIT' } };
            }
            return { response: "Okay, balance hidden.", status: "COMPLETED", data: { supportStep: 'INIT' } };
        }

        // ---------------------------------------------------------
        // INTENT 2: BLOCK CARD (Emergency)
        // ---------------------------------------------------------
        if (step === 'INIT' && (lowerInput.includes('block') || lowerInput.includes('lost') || lowerInput.includes('stolen'))) {
            return {
                response: `🚨 **Emergency Mode**: Do you want to permanently BLOCK your Debit Card ending in **${userAccount.cardLast4 || 'XXXX'}**? This cannot be undone. Type 'Yes' to confirm.`,
                status: "AWAITING_INPUT",
                data: { supportStep: 'CONFIRM_BLOCK' }
            };
        }
        if (step === 'CONFIRM_BLOCK') {
            if (lowerInput.includes('yes') || lowerInput.includes('block')) {
                return {
                    response: `Your card has been **BLOCKED** immediately. A replacement will be mailed to your registered address within 5 working days.  Reference: BLK-${Math.floor(Math.random() * 10000)}`,
                    status: "COMPLETED",
                    data: { supportStep: 'INIT' }
                };
            }
            return { response: "Card block cancelled. Your card is still active.", status: "COMPLETED", data: { supportStep: 'INIT' } };
        }

        // ---------------------------------------------------------
        // INTENT 3: DISPUTE TRANSACTION (Fraud)
        // ---------------------------------------------------------
        if (step === 'INIT' && (lowerInput.includes('dispute') || lowerInput.includes('fraud') || lowerInput.includes('wrong transaction'))) {
            const lastTxn = userAccount.recentTransactions[0];
            return {
                response: `I can help raise a dispute. Are you referring to the last transaction: **₹${lastTxn.amount} at ${lastTxn.desc}**?`,
                status: "AWAITING_INPUT",
                data: { supportStep: 'CONFIRM_DISPUTE', disputeTxn: lastTxn }
            };
        }
        if (step === 'CONFIRM_DISPUTE') {
            if (lowerInput.includes('yes')) {
                return {
                    response: `Dispute Ticket **#DSP-${Date.now().toString().slice(-4)}** raised. The amount will be temporarily credited back within 48 hours pending investigation. `,
                    status: "COMPLETED",
                    data: { supportStep: 'INIT' }
                };
            }
            return { response: "Please contact the branch for older transactions.", status: "COMPLETED", data: { supportStep: 'INIT' } };
        }

        // ---------------------------------------------------------
        // INTENT 4: UPDATE EMAIL (Profile)
        // ---------------------------------------------------------
        if (step === 'INIT' && (lowerInput.includes('update email') || lowerInput.includes('change email'))) {
            return {
                response: `To update your email, please type the **New Email Address**.`,
                status: "AWAITING_INPUT",
                data: { supportStep: 'WAITING_EMAIL' }
            };
        }
        if (step === 'WAITING_EMAIL') {
            const emailMatch = input.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
                return {
                    response: `I've sent an OTP to your mobile to confirm changing email to **${emailMatch[0]}**. Please type the OTP (Mock: 1234).`,
                    status: "AWAITING_INPUT",
                    data: { supportStep: 'CONFIRM_OTP_EMAIL', newEmail: emailMatch[0] }
                };
            }
            return { response: "That didn't look like a valid email. Try again.", status: "AWAITING_INPUT", data: { supportStep: 'WAITING_EMAIL' } };
        }
        if (step === 'CONFIRM_OTP_EMAIL') {
            if (input.includes('1234')) {
                return { response: `Success! Your email has been updated to **${context.newEmail}**.`, status: "COMPLETED", data: { supportStep: 'INIT' } };
            }
            return { response: "Incorrect OTP. Update cancelled.", status: "COMPLETED", data: { supportStep: 'INIT' } };
        }

        // ---------------------------------------------------------
        // FALLBACK
        // ---------------------------------------------------------
        return {
            response: "I can help with **Balance**, **Blocking Cards**, **Disputes**, or **Updating Email**. What do you need?",
            status: "AWAITING_INPUT",
            data: { supportStep: 'INIT' }
        };
    }
}

module.exports = new SupportAgent();