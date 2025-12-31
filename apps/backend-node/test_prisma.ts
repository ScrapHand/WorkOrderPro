import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

// Attempt to initialize
try {
    const prisma = new PrismaClient();
    console.log('PrismaClient initialized.');

    prisma.$connect()
        .then(() => {
            console.log('Successfully connected to DB.');
            return prisma.$queryRaw`SELECT 1`;
        })
        .then((res) => {
            console.log('Query Result:', res);
            process.exit(0);
        })
        .catch((e) => {
            console.error('Connection/Query Error:', e);
            process.exit(1);
        });

} catch (e) {
    console.error('Initialization Error:', e);
}
