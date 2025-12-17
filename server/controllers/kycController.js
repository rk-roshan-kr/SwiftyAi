const User = require('../models/User');

// A Mock Database of "Valid" Users for the Hackathon
const MOCK_CRM_DB = {
    "ABCDE1234F": { name: "Roshan Kumar", status: "VERIFIED", score: 750 },
    "ABCDE9999Z": { name: "John Doe", status: "REJECTED", score: 400 }
};

// 1. The Validation Logic (Regex + Database Check)
const verifyDocument = async (req, res) => {
    // mobile is optional, added for binding verification to a user
    const { type, value, mobile } = req.body;

    console.log(`[KYC Agent] Verifying ${type}: ${value} for ${mobile || 'Unknown'}...`);

    // Simulate network delay for "Realism" in UI
    await new Promise(resolve => setTimeout(resolve, 2000));

    let isValidFormat = false;

    // REGEX VALIDATION
    if (type === 'PAN') {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        isValidFormat = panRegex.test(value);
    } else if (type === 'AADHAAR') {
        const aadhaarRegex = /^\d{12}$/;
        isValidFormat = aadhaarRegex.test(value.replace(/\s/g, ''));
    }

    if (!isValidFormat) {
        return res.json({
            success: false,
            message: `Invalid ${type} format. Please check and try again.`
        });
    }

    // MOCK EXTERNAL DB CHECK (DigiLocker / CIBIL)
    const userRecord = MOCK_CRM_DB[value];

    if (userRecord) {
        console.log(`[KYC Agent] Connecting to DigiLocker for ${value}...`);
        await new Promise(r => setTimeout(r, 800));
        console.log(`[KYC Agent] Fetching CIBIL Score for ${value}...`);

        if (userRecord.status === "VERIFIED") {
            const resultData = {
                name: userRecord.name,
                creditScore: userRecord.score,
                verificationId: "KYC-" + Math.floor(Math.random() * 10000),
                source: "DigiLocker"
            };

            // If we know the user, update their status in MongoDB
            if (mobile) {
                await User.findOneAndUpdate(
                    { mobile },
                    { kycStatus: "VERIFIED", $set: { "linkedDocuments.pan.isVerified": true } }, // Simple update
                    { new: true }
                );
                console.log(`[KYC Agent] Updated Mongo Status for ${mobile}`);
            }

            return res.json({
                success: true,
                data: resultData,
                message: "Identity Verified via DigiLocker."
            });
        } else {
            return res.json({ success: false, message: "KYC Rejected: Low Internal Score." });
        }
    }

    // Fallback for random valid formats
    console.log(`[KYC Agent] No internal record. Querying National Database...`);
    const randomScore = Math.floor(Math.random() * (850 - 600 + 1)) + 600;
    const isApproved = randomScore >= 700;

    if (isApproved && mobile) {
        await User.findOneAndUpdate({ mobile }, { kycStatus: "VERIFIED" });
    }

    return res.json({
        success: true,
        data: {
            name: "Verified User (External)",
            creditScore: randomScore,
            verificationId: "KYC-EXT-" + Math.floor(Math.random() * 1000),
            source: "National ID Database"
        },
        message: isApproved ? "Identity Verified. Credit Check Complete." : "Identity Verified. Credit Score Low."
    });
};

module.exports = { verifyDocument };
