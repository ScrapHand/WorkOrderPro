const { execSync } = require('child_process');
const path = require('path');

// Helper to get env content via shell (handles encoding better than fs sometimes on Windows)
function getEnvContent() {
    try {
        // 'type' is Windows equivalent of cat
        return execSync('type .env', { cwd: path.join(__dirname, '../'), encoding: 'utf8' });
    } catch (e) {
        console.error('Failed to read .env via shell:', e.message);
        return '';
    }
}

const content = getEnvContent();
const lines = content.split(/\r?\n/);
lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const val = vals.join('=');
        if (key && val) {
            process.env[key.trim()] = val.trim();
        }
    }
});

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('❌ DATABASE_URL missing significantly! Dump:', Object.keys(process.env));
    process.exit(1);
}

console.log('✅ DATABASE_URL loaded via shell method.');

try {
    console.log('🚀 Running Prisma Migrate...');
    execSync('npx prisma migrate dev --name add_tenant_secrets', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log('🔄 Generating Prisma Client...');
    execSync('npx prisma generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log('✅ ALL DONE.');

} catch (error) {
    console.error('❌ FAILED:', error.message);
    process.exit(1);
}
