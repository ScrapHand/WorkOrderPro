"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
// Attempt to initialize
try {
    const prisma = new client_1.PrismaClient();
    console.log('PrismaClient initialized.');
    prisma.$connect()
        .then(() => {
        console.log('Successfully connected to DB.');
        return prisma.$queryRaw `SELECT 1`;
    })
        .then((res) => {
        console.log('Query Result:', res);
        process.exit(0);
    })
        .catch((e) => {
        console.error('Connection/Query Error:', e);
        process.exit(1);
    });
}
catch (e) {
    console.error('Initialization Error:', e);
}
