-- AlterTable
ALTER TABLE "clinics" ADD COLUMN "ownerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clinics_ownerId_key" ON "clinics"("ownerId");

-- CreateIndex
CREATE INDEX "clinics_ownerId_idx" ON "clinics"("ownerId");
