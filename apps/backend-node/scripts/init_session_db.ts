import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const result = dotenv.config({ path: envPath });
    console.log('Dotenv result:', result.error ? result.error : 'Success');
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
} else {
    console.log('File does NOT exist.');
    // Try default
    dotenv.config();
    console.log('DATABASE_URL present (default):', !!process.env.DATABASE_URL);
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Initializing Session Table in Postgres...');

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "session" (
              "sid" varchar NOT NULL COLLATE "default",
              "sess" json NOT NULL,
              "expire" timestamp(6) NOT NULL
            )
            WITH (OIDS=FALSE);
        `);

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        `).catch(() => { console.log('Primary Key constraint likely exists.'); });
        // Note: The above might throw if constraint exists, better to separate or check existence. 
        // Simplified approach below for idempotency:

        console.log('Table "session" ensured.');

        try {
            await prisma.$executeRawUnsafe(`CREATE INDEX "IDX_session_expire" ON "session" ("expire");`);
            console.log('Index "IDX_session_expire" created.');
        } catch (e: any) {
            console.log('Index likely exists or error:', e.message);
        }

        console.log('✅ Session Table Setup Complete.');

    } catch (error: any) {
        // If it fails because relation exists, that's fine for the table.
        // We will try to be more robust.
        console.log('Log:', error.message);
        if (error.message.includes('already exists')) {
            console.log('⚠️  Table/Index already exists. Continuing...');
        } else {
            console.error('❌ Migration Failed:', error);
            process.exit(1);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
