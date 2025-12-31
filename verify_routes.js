const fs = require('fs');
const path = require('path');

// Configuration
const SIDEBAR_PATH = path.join(__dirname, 'apps/web/src/components/layout/Sidebar.tsx');
const APP_DIR = path.join(__dirname, 'apps/web/src/app');

// Regex to find hrefs
const LINK_REGEX = /href:\s*"([^"]+)"/g;

function verifyRoutes() {
    console.log("🔍 Starting Sidebar Route Verification...");

    if (!fs.existsSync(SIDEBAR_PATH)) {
        console.error(`❌ Sidebar file not found at ${SIDEBAR_PATH}`);
        process.exit(1);
    }

    const sidebarContent = fs.readFileSync(SIDEBAR_PATH, 'utf8');
    let match;
    let errors = 0;
    let checked = 0;

    while ((match = LINK_REGEX.exec(sidebarContent)) !== null) {
        const route = match[1];
        if (route === "/" || route.startsWith("http")) continue; // Skip root or external

        checked++;
        // Convention: /dashboard/assets -> apps/web/src/app/dashboard/assets/page.tsx
        //             /dashboard/assets/[id] -> apps/web/src/app/dashboard/assets/[id]/page.tsx

        const relativePath = route.replace(/^\//, ''); // Remove leading slash
        const filePath = path.join(APP_DIR, relativePath, 'page.tsx');

        if (!fs.existsSync(filePath)) {
            console.error(`❌ BROKEN LINK: ${route}`);
            console.error(`   Expected file: ${filePath}`);
            errors++;
        } else {
            console.log(`✅ OK: ${route}`);
        }
    }

    console.log("---------------------------------------------------");
    console.log(`Checked ${checked} links.`);
    if (errors > 0) {
        console.error(`🚨 FOUND ${errors} BROKEN LINKS. Deployment Unsafe.`);
        process.exit(1);
    } else {
        console.log(`✨ All sidebar links map to existing files.`);
        process.exit(0);
    }
}

verifyRoutes();
