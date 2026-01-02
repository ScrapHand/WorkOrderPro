import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

console.log('--- ENV DEBUG ---');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);

const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
];

let loaded = false;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`Found .env at: ${p}`);
        const result = dotenv.config({ path: p });
        if (result.error) {
            console.error(`Error loading ${p}:`, result.error);
        } else {
            console.log(`Loaded ${p}`);
            loaded = true;
            break;
        }
    } else {
        console.log(`Missing .env at: ${p}`);
    }
}

if (!loaded) {
    console.error('FAILED TO LOAD ANY .ENV FILE');
}

console.log('DATABASE_URL is:', process.env.DATABASE_URL ? 'DEFINED (Length: ' + process.env.DATABASE_URL.length + ')' : 'UNDEFINED');
console.log('--- END DEBUG ---');
