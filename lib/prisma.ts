// lib/prisma.ts
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
  
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ?? 
  new PrismaClient({ adapter }); // Pass the adapter here!

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}


