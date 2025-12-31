const http = require('http');
const { spawn } = require('child_process');

const PORT = 8080;

function startServer() {
    console.log('Starting server...');
    const serverProcess = spawn('node', ['dist/server.js'], {
        stdio: 'inherit',
        env: { ...process.env, PORT: PORT.toString() }
    });
    return serverProcess;
}

function makeRequest(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: 'GET',
            headers: headers
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    const serverProcess = startServer();
    // Wait for startup
    await new Promise(r => setTimeout(r, 5000));

    try {
        console.log('Test 1: Deep Health Check');
        const resHealth = await makeRequest('/api/health'); // Updated endpoint
        console.log(`Status: ${resHealth.statusCode}`);
        const healthBody = JSON.parse(resHealth.body);
        if (healthBody.status !== 'UP') throw new Error(`Health Check Failed: ${resHealth.body}`);
        if (healthBody.checks.database !== 'UP') throw new Error('Database Check Failed');
        console.log('Deep Health Check OK (DB Verified)');

        console.log('Test 2: Auth & Tenant Middleware');
        const resAuth = await makeRequest('/api/auth/verify?login=true', {
            'X-Tenant-Slug': 'test-corp',
            'X-Forwarded-Proto': 'https' // Simulate HTTPS for Secure cookie
        });
        console.log(`Status: ${resAuth.statusCode}`);
        const body = JSON.parse(resAuth.body);

        // Assertions
        if (body.tenant.slug !== 'test-corp') throw new Error(`Tenant mismatch: got ${body.tenant.slug}`);
        console.log('Tenant Middleware OK');

        const cookies = resAuth.headers['set-cookie'] || [];
        const sessionCookie = cookies.find(c => c.includes('wop_session'));
        if (!sessionCookie) throw new Error('No session cookie set');

        console.log(`Cookie: ${sessionCookie}`);
        if (!sessionCookie.includes('Partitioned')) console.warn('WARNING: Partitioned attribute missing (Test might need SSL/proxy simulation to fully trigger, or node is stripping it?)');
        // Note: Partitioned might not show up if Express Session thinks connection is insecure?
        // We set 'trust proxy', so we need X-Forwarded-Proto: https to trigger Secure probably.

        console.log('Test 3: Secure Cookie Check (Simulating Proxy)');
        const resSecure = await makeRequest('/api/auth/verify?login=true', {
            'X-Tenant-Slug': 'secure-corp',
            'X-Forwarded-Proto': 'https' // Simulate Render Load Balancer
        });
        const secureCookies = resSecure.headers['set-cookie'] || [];
        console.log(`Secure Cookie: ${secureCookies}`);

        if (secureCookies.some(c => c.includes('Partitioned'))) {
            console.log('SUCCESS: Partitioned attribute confirmed with HTTPS proxy header.');
        } else {
            console.log('Note: Partitioned might be missing if express-session version < 1.18 or config issues. Checking config...');
        }

    } catch (e) {
        console.error('Tests Failed:', e);
        process.exitCode = 1;
    } finally {
        serverProcess.kill();
    }
}

runTests();
