// lib/prisma.js
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Funkcja tworząca klienta
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  // 1. Pula połączeń Postgres
  const pool = new Pool({ connectionString });

  // 2. Adapter Prisma
  const adapter = new PrismaPg(pool);

  // 3. Klient Prisma z adapterem
  return new PrismaClient({ adapter });
};

// Singleton dla Next.js (Hot Reloading)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
