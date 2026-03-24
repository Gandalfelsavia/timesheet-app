import "dotenv/config";
import path from "path";
import ExcelJS from "exceljs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

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

  const worksheet = workbook.getWorksheet("Database Clienti");

  if (!worksheet) {
    throw new Error('Foglio "Database Clienti" non trovato.');
  }

  let imported = 0;
  let skipped = 0;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rawName = row.getCell(1).value;

    const clientName = String(rawName ?? "").trim();

    if (!clientName) {
      skipped++;
      continue;
    }

    const existing = await prisma.client.findFirst({
      where: {
        clientName: {
          equals: clientName,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.client.create({
      data: {
        clientName,
        isActive: true,
        importSource: "excel",
      },
    });

    imported++;
  }

  console.log(`Clienti importati: ${imported}`);
  console.log(`Clienti saltati: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Errore import clienti:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
