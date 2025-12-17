import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASETS_DIR = path.join(__dirname, 'datasets');
const OUTPUT_FILE = path.join(__dirname, 'full_unique_dataset.json');

function mergeAndDedupe() {
    if (!fs.existsSync(DATASETS_DIR)) {
        console.error("No datasets directory found.");
        return;
    }

    const files = fs.readdirSync(DATASETS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Reading ${files.length} files...`);

    let allItems = [];
    const seenTexts = new Set();
    let duplicates = 0;

    for (const file of files) {
        const filePath = path.join(DATASETS_DIR, file);
        const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const item of items) {
            // Create a unique key based on text (ignoring case for stricter dedup)
            const key = item.text.trim().toLowerCase();

            if (seenTexts.has(key)) {
                duplicates++;
            } else {
                seenTexts.add(key);
                allItems.push(item);
            }
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allItems, null, 2));

    console.log(`\n--- MERGE COMPLETE ---`);
    console.log(`Total Items Scanned: ${allItems.length + duplicates}`);
    console.log(`Duplicates Removed: ${duplicates}`);
    console.log(`Unique Items Remaining: ${allItems.length}`);
    console.log(`Saved to: ${OUTPUT_FILE}`);
}

mergeAndDedupe();
