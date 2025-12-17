const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    mobile: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: String,
    role: { type: String, default: 'User' },

    // KYC SECTION (Used by VerificationAgent)
    kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'FAILED'], default: 'PENDING' },
    digilockerId: String,
    linkedDocuments: {
        pan: { idNumber: String, name: String, isVerified: Boolean },
        aadhaar: { idNumber: String, name: String, isVerified: Boolean }
    },

    // FINANCIAL SECTION (Used by SupportAgent & UnderwritingAgent)
    // Replaces mockCRM.json
    accountDetails: {
        accountId: String, // e.g., "ACC123456"
        accountType: { type: String, default: 'Savings' },
        balance: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        cardLast4: String, // For Block Card feature
        isFrozen: { type: Boolean, default: false } // For Emergency Block
    },

    // CIBIL CACHE (Used by UnderwritingAgent)
    creditProfile: {
        score: Number,
        lastChecked: Date
    },

    securitySettings: {
        twoFactor: { type: Boolean, default: true },
        pin: String // Encrypt this in real app
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;