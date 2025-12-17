import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'datasets');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const CATEGORIES = [
    {
        cat: 'card_lost', intent: 'BLOCK_CARD', templates: [
            "I lost my {card_type}", "My {card_type} is missing", "Someone stole my {card_type}", "Can't find my {card_type}", "Block my {card_type}"
        ], follows: [
            "How long to get a new one?", "Is there a fee?", "Can I still use the app?", "Did any transactions go through?", "Will my Apple Pay stop working?"
        ]
    },
    {
        cat: 'transfer_failed', intent: 'CHECK_TRANSACTION', templates: [
            "Transfer to {person} failed", "Payment of {amount} didn't go through", "Why did my transaction fail?", "Money didn't reach {person}", "Error sending {amount}"
        ], follows: [
            "Can you reverse it?", "When will I get a refund?", "Try again please", "Is the receiver valid?", "Check my balance"
        ]
    },
    {
        cat: 'loan_application', intent: 'SALES_AGENT', templates: [
            "I need a loan for {purpose}", "Can I borrow {amount}?", "Interest rate for {purpose} loan?", "Apply for {purpose} loan", "Do you give loans for {purpose}?"
        ], follows: [
            "What are the documents needed?", "How much EMI?", "Is the rate fixed?", "Can I prepay?", "What is the processing fee?"
        ]
    },
    {
        cat: 'kyc_update', intent: 'VERIFICATION_AGENT', templates: [
            "Update my {doc}", "{doc} is expired", "Change address in {doc}", "Upload new {doc}", "Verify my {doc}"
        ], follows: [
            " How long will it take?", "Is online upload enough?", "Do I need to visit branch?", "Will my account work?", "Check status"
        ]
    },
    {
        cat: 'account_opening', intent: 'NEW_APPLICATION', templates: [
            "Open {acc_type} account", "I want a new {acc_type}", "Start {acc_type} banking", "New {acc_type} for my son", "Join with {acc_type}"
        ], follows: [
            "What is minimum balance?", "Do I get a debit card?", "Is checkbook free?", "Online banking included?", "Interest rate?"
        ]
    }
];

const VARS = {
    card_type: ['Visa', 'Debit Card', 'Credit Card', 'Platinum Card', 'Travel Card'],
    person: ['John', 'Mom', 'Landlord', 'Amazon', 'Uber'],
    amount: ['500$', '1000 Euros', '50 bucks', '10k', 'rent'],
    purpose: ['car', 'home', 'wedding', 'vacation', 'business'],
    doc: ['Aadhaar', 'Passport', 'Driving License', 'PAN Card', 'Voter ID'],
    acc_type: ['Savings', 'Current', 'Student', 'Salary', 'Joint']
};

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateItem(id) {
    const category = getRandom(CATEGORIES);
    let text = getRandom(category.templates);

    // Replace variables
    Object.keys(VARS).forEach(key => {
        text = text.replace(`{${key}}`, getRandom(VARS[key]));
    });

    return {
        id: id,
        category: category.cat,
        expected_intent: category.intent,
        text: text,
        follow_up: getRandom(category.follows)
    };
}

// Generate 10 files of 50 items
for (let i = 1; i <= 2; i++) {
    const dataset = [];
    for (let j = 1; j <= 500; j++) {
        dataset.push(generateItem(`${i}-${j}`));
    }
    const filename = path.join(OUTPUT_DIR, `dataset_${i}.json`);
    fs.writeFileSync(filename, JSON.stringify(dataset, null, 2));
    console.log(`Generated ${filename}`);
}
