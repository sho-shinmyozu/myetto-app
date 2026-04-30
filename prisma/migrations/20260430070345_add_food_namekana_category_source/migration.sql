-- AlterTable
ALTER TABLE "BrandedFood" ADD COLUMN     "category" TEXT,
ADD COLUMN     "nameKana" TEXT;

-- AlterTable
ALTER TABLE "GenericFood" ADD COLUMN     "nameKana" TEXT;

-- AlterTable
ALTER TABLE "UserFood" ADD COLUMN     "category" TEXT,
ADD COLUMN     "nameKana" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX "BrandedFood_nameKana_idx" ON "BrandedFood"("nameKana");

-- CreateIndex
CREATE INDEX "GenericFood_nameKana_idx" ON "GenericFood"("nameKana");
