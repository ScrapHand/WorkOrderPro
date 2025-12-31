const fs = require('fs');
const path = require('path');

// Configuration
const WEB_DIR = path.join(__dirname, '../apps/web/src');
const BACKEND_DIR = path.join(__dirname, '../apps/backend-node/src');

// Regex
const FRONTEND_REGEX = /api\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]/g;
const BACKEND_REGEX = /router\.(get|post|put|patch|delete|use)\(['"`]([^'"`]+)['"`]/g;
const EXPRESS_APP_REGEX = /app\.(get|post|put|patch|delete|use)\(['"`]([^'"`]+)['"`]/g;

// Store results
const frontendCalls = new Set();
const backendRoutes = new Set();

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            callback(filePath);
        }
    }
}

function scanFrontend() {
    console.log("🔍 Scanning Frontend API Calls...");
    walkDir(WEB_DIR, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        while ((match = FRONTEND_REGEX.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            const url = match[2];
            // Normalize: /api/v1/users -> /users (since client base is /api/v1)
            // But verify_routes script assumes specific structure. 
            // Here we just log what we see.
            frontendCalls.add(`${method} ${url}`);
        }
    });
}

function scanBackend() {
    console.log("🔍 Scanning Backend Routes...");
    walkDir(BACKEND_DIR, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        let match;
        while ((match = BACKEND_REGEX.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            const route = match[2];
            backendRoutes.add(`${method} ${route}`);
        }
        while ((match = EXPRESS_APP_REGEX.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            const route = match[2];
            backendRoutes.add(`${method} ${route}`);
        }
    });
}

function report() {
    console.log("\n-------- FRONTEND API CALLS --------");
    Array.from(frontendCalls).sort().forEach(c => console.log(c));

    console.log("\n-------- BACKEND ROUTE DEFS --------");
    Array.from(backendRoutes).sort().forEach(r => console.log(r));

    console.log("\n-------- AUDIT SUMMARY --------");
    console.log("Note: This is a static string match. Dynamic routes with variables (e.g. /users/${id}) may verify loosely.");

    // Simple heuristic check
    frontendCalls.forEach(call => {
        // Very basic checks
        if (call.includes("${")) {
            console.log(`⚠️  Dynamic Call: ${call} - Cannot statically verify.`);
        } else {
            // Backend routes often defined as / or /:id inside a router mounted at /users
            // This script is high-level. 
            console.log(`ℹ️  Found Call: ${call}`);
        }
    });
}

scanFrontend();
scanBackend();
report();
