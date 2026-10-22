import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Conexão com PostgreSQL (Neon ou local) usando a DATABASE_URL do .env
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

export { prisma };
