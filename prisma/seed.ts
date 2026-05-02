import { PrismaClient, Prisma } from "@prisma/client";
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
  imageUrls?: string[];
  scores?: Record<string, number>;
  tags?: string[];
  recommendedIndustries?: string[];
};

const META_PATH = path.resolve(__dirname, "../uploads/catalog/mock-meta.json");

async function loadMockMeta(): Promise<CatalogMockMeta[]> {
  try {
    const raw = await fs.readFile(META_PATH, "utf-8");
    return JSON.parse(raw) as CatalogMockMeta[];
  } catch {
    console.warn(
      `[seed] mock-meta.json not found at ${META_PATH}\n        run "npm run catalog:generate" first.`,
    );
    return [];
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const mocks = await loadMockMeta();

  for (const mock of mocks) {
    const data: Prisma.CatalogModelUncheckedCreateInput = {
      name: mock.name,
      gender: mock.gender,
      age: mock.age,
      primaryLabel: mock.primaryLabel,
      faceImageUrl: mock.faceImageUrl,
      imageUrls: (mock.imageUrls ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      scores: (mock.scores ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      tags: (mock.tags ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      recommendedIndustries: (mock.recommendedIndustries ??
        Prisma.JsonNull) as Prisma.InputJsonValue,
      isActive: true,
    };

    const existing = await prisma.catalogModel.findFirst({
      where: { name: mock.name },
    });
    if (existing) {
      await prisma.catalogModel.update({ where: { id: existing.id }, data });
      console.log(`[seed] catalog "${mock.name}" updated`);
    } else {
      await prisma.catalogModel.create({ data });
      console.log(`[seed] catalog "${mock.name}" inserted`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
