import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";

type CatalogMockMeta = {
  slug: string;
  name: string;
  gender: string;
  age: string;
  primaryLabel: string;
  faceImageUrl: string;
};

const META_PATH = path.resolve(__dirname, "../uploads/catalog/mock-meta.json");

async function loadMockMeta(): Promise<CatalogMockMeta[]> {
  try {
    const raw = await fs.readFile(META_PATH, "utf-8");
    return JSON.parse(raw) as CatalogMockMeta[];
  } catch {
    console.warn(
      `[seed] mock-meta.json not found at ${META_PATH}\n        run "npx tsx scripts/generateMockCatalog.ts" first to generate mock catalog images.`,
    );
    return [];
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const mocks = await loadMockMeta();

  for (const mock of mocks) {
    const existing = await prisma.catalogModel.findFirst({
      where: { name: mock.name },
    });
    if (existing) {
      console.log(`[seed] catalog "${mock.name}" exists, skip`);
      continue;
    }
    await prisma.catalogModel.create({
      data: {
        name: mock.name,
        gender: mock.gender,
        age: mock.age,
        primaryLabel: mock.primaryLabel,
        faceImageUrl: mock.faceImageUrl,
        isActive: true,
      },
    });
    console.log(`[seed] catalog "${mock.name}" inserted`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
