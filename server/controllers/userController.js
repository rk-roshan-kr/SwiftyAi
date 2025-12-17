const User = require('../models/User');

// Update or Create User Profile
const updateUserProfile = async (req, res) => {
    const { mobile, name, email, securitySettings, linkedAccounts } = req.body;

    if (!mobile) {
        return res.status(400).json({ success: false, message: "Mobile number is required to identify user" });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { mobile },
            {
                $set: {
                    name,
                    email,
                    // Merge or overwrite logic depends on requirement. 
                    // Using set ensures these specific fields are updated.
                    ...(securitySettings && { securitySettings }),
                    ...(linkedAccounts && { linkedAccounts }),
                    lastUpdated: new Date()
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        console.log(`[Backend] MongoDB Profile Updated: ${mobile}`);

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get User Profile
const getUserProfile = async (req, res) => {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ success: false, message: "Mobile required" });

    try {
        const user = await User.findOne({ mobile });

        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
}

module.exports = { updateUserProfile, getUserProfile };
