const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/mockDigiLocker.json');

const loadDB = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error loading mock DB:", err);
        return { users: [] };
    }
};

const login = (req, res) => {
    const { mobile, pin } = req.body;
    const db = loadDB();

    // Simulate finding user
    const user = db.users.find(u => u.mobile === mobile);

    if (!user) {
        return res.json({ success: false, message: "User not found. Try Mobile: 9876543210" });
    }

    if (user.pin !== pin) {
        return res.json({ success: false, message: "Invalid Security PIN. Try: 123456" });
    }

    // Generate a fake session/access token
    const token = Buffer.from(user.username).toString('base64');

    return res.json({
        success: true,
        message: "OTP Sent Successfully",
        otpRequired: true,
        tempToken: token // In real world, sending token before OTP is bad, but this is a hackathon mock
    });
};

const verifyOTP = (req, res) => {
    const { otp, tempToken } = req.body;

    // Mock OTP Check (Always 123456 or 000000)
    if (otp === "123456" || otp === "000000") {
        return res.json({
            success: true,
            message: "Login Successful",
            accessToken: tempToken, // Reusing for simplicity
            user: {
                name: "Roshan Kumar", // Needs to be dynamic based on token in real app
                kycStatus: "VERIFIED"
            }
        });
    }

    return res.json({ success: false, message: "Invalid OTP. Try 123456" });
};

const APP_DB_PATH = path.join(__dirname, '../data/mockAppDB.json');

const getDocuments = (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(401).json({ error: "Unauthorized" });

    const db = loadDB();
    // Decode token to get username (Simple Mock Logic)
    const username = Buffer.from(accessToken, 'base64').toString('utf8');
    const user = db.users.find(u => u.username === username);

    if (user) {
        // Simulate delay & Sync to App DB
        setTimeout(() => {
            try {
                // Read App DB
                const appDBData = fs.readFileSync(APP_DB_PATH, 'utf8');
                const appDB = JSON.parse(appDBData);

                // Find or Create User in App DB (Mock: assuming single user or matching name)
                const appUserIndex = appDB.findIndex(u => u.name === user.name);

                if (appUserIndex !== -1) {
                    appDB[appUserIndex].linkedDocuments = user.documents;
                    appDB[appUserIndex].kycStatus = "VERIFIED";
                    appDB[appUserIndex].digilockerId = user.username;
                } else {
                    appDB.push({
                        userId: `user_${Date.now()}`,
                        name: user.name,
                        kycStatus: "VERIFIED",
                        linkedDocuments: user.documents,
                        digilockerId: user.username
                    });
                }

                // Write Sync
                fs.writeFileSync(APP_DB_PATH, JSON.stringify(appDB, null, 2));
                console.log(`[Backend] Synced DigiLocker data for ${user.name} to App DB.`);

            } catch (err) {
                console.error("Error syncing to App DB:", err);
            }

            res.json({
                success: true,
                documents: user.documents,
                userProfile: {
                    name: user.name,
                    dob: user.dob,
                    gender: user.gender
                }
            });
        }, 1500);
    } else {
        res.status(404).json({ success: false, message: "Documents not found" });
    }
};

module.exports = { login, verifyOTP, getDocuments };
