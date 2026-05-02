-- AlterTable
ALTER TABLE "catalog_models" ADD COLUMN     "imageUrls" JSONB,
ADD COLUMN     "rank" INTEGER,
ADD COLUMN     "recommendedIndustries" JSONB,
ADD COLUMN     "tags" JSONB;

-- CreateIndex
CREATE INDEX "catalog_models_rank_idx" ON "catalog_models"("rank");
