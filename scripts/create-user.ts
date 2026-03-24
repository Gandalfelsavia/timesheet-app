import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL non trovato nel file .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const existing = await prisma.user.findFirst({
    where: { email: "admin@studio.it" },
  });

  if (existing) {
    console.log("Utente già presente con ID:", existing.id.toString());
    return;
  }

  const user = await prisma.user.create({
    data: {
      fullName: "Amministratore Studio",
      email: "admin@studio.it",
      passwordHash: "temp-password",
      role: "admin",
      isActive: true,
    },
  });

  console.log("Utente creato con ID:", user.id.toString());
}

main()
  .catch((error) => {
    console.error("Errore creazione utente:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });