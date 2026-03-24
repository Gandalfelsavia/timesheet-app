import "dotenv/config";
import path from "path";
import ExcelJS from "exceljs";
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
  const filePath = path.join(process.cwd(), "data", "clienti-attivita.xlsx");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet("Database Attività");

  if (!worksheet) {
    throw new Error('Foglio "Database Attività" non trovato.');
  }

  let imported = 0;
  let skipped = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rawName = row.getCell(1).value;
    const activityName = String(rawName ?? "").trim();

    if (!activityName) {
      skipped++;
      continue;
    }

    const existing = await prisma.activityType.findFirst({
      where: {
        activityName,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.activityType.create({
      data: {
        activityName,
        isActive: true,
        importSource: "excel",
      },
    });

    imported++;
  }

  console.log(`Attività importate: ${imported}`);
  console.log(`Attività saltate: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Errore import attività:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });