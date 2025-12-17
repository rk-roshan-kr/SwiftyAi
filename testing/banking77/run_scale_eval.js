import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.join(__dirname, 'full_unique_dataset.json');
const SUMMARY_PATH = path.join(__dirname, 'evaluation_summary.json');

async function runScaledEval() {
    if (!fs.existsSync(DATASET_PATH)) {
        console.error("Merged dataset not found. Run merge_datasets.js first.");
        return;
    }

    const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
    console.log(`Loaded ${dataset.length} unique items for Massive Scale Test...`);

    const allResults = [];
    let grandTotalPassed = 0;
    let grandTotal = 0;

    console.log(`\n--- Processing Merged Dataset ---`);

    for (const example of dataset) {
        grandTotal++;
        let status = 'FAIL';
        let botResponse = '';

        try {
            // 1. Ask Initial Question
            const res = await axios.post('http://localhost:5000/api/chat', {
                message: example.text,
                sessionId: `scale-${example.id}`,
                mobile: '9999999999'
            }, { responseType: 'text' });

            botResponse = res.data.toLowerCase();
            const expected = example.expected_intent.toLowerCase().replace('_', ' ');

            // Check Match
            let isMatch = false;
            // Strict Keyword & Routing Logic
            if (example.expected_intent === 'SALES_AGENT' && (botResponse.includes('loan') || botResponse.includes('rate'))) isMatch = true;
            else if (example.expected_intent === 'VERIFICATION_AGENT' && (botResponse.includes('verify') || botResponse.includes('kyc'))) isMatch = true;
            else if (botResponse.includes(expected)) isMatch = true;
            else if (example.category === 'card_lost' && botResponse.includes('block')) isMatch = true;

            if (isMatch) status = 'PASS';

            // 2. Ask Follow-up (Simulating conversation depth)
            if (status === 'PASS' && example.follow_up) {
                await axios.post('http://localhost:5000/api/chat', {
                    message: example.follow_up,
                    sessionId: `scale-${example.id}`,
                    mobile: '9999999999'
                }, { responseType: 'text' });
            }

        } catch (e) {
            status = 'ERROR';
            botResponse = e.message;
        }

        if (status === 'PASS') grandTotalPassed++;

        allResults.push({
            id: example.id,
            input: example.text,
            expected: example.expected_intent,
            response: botResponse,
            status: status
        });

        if (grandTotal % 10 === 0) process.stdout.write('.');
    }


    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(allResults, null, 2));

    console.log(`\n\n=== MASSIVE SCALE RESULT ===`);
    console.log(`Total Conversations: ${grandTotal}`);
    console.log(`Passed: ${grandTotalPassed}`);
    console.log(`Success Rate: ${((grandTotalPassed / grandTotal) * 100).toFixed(2)}%`);
    console.log(`Full Logs Saved To: ${SUMMARY_PATH}`);
}

runScaledEval();
