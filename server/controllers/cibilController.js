const fs = require('fs');
const path = require('path');

const CIBIL_DB_PATH = path.join(__dirname, '../data/mockCIBIL.json');

const getCibilScore = (req, res) => {
    const { pan } = req.body;

    if (!pan) {
        return res.status(400).json({ success: false, message: "PAN is required" });
    }

    try {
        const data = fs.readFileSync(CIBIL_DB_PATH, 'utf8');
        const cibilDB = JSON.parse(data);
        const record = cibilDB.find(r => r.pan === pan);

        if (record) {
            console.log(`[CIBIL API] Score fetched for PAN: ${pan}`);
            // Simulate API latency
            setTimeout(() => {
                res.json({
                    success: true,
                    data: record
                });
            }, 1000);
        } else {
            console.log(`[CIBIL API] No record found for PAN: ${pan}`);
            // Create a default/random score for unknown PANs for demo continuity
            setTimeout(() => {
                res.json({
                    success: true,
                    data: {
                        pan: pan,
                        score: 720, // Default safe score
                        lastUpdated: new Date().toISOString().split('T')[0],
                        history: []
                    }
                });
            }, 1000);
        }
    } catch (err) {
        console.error("CIBIL DB Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = { getCibilScore };
