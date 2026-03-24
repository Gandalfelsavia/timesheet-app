import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "../lib/password";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL non trovato");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "amministrazione@absvconsulting.it";
  const newPassword = "admin123";

  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    throw new Error("Utente admin non trovato");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(newPassword),
    },
  });

  console.log(`Password aggiornata per ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });