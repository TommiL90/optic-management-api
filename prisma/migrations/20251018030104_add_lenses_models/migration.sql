-- CreateTable
CREATE TABLE "PrescriptionRange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "odMaxSphere" REAL NOT NULL,
    "odMaxCylinder" REAL NOT NULL,
    "oiMaxSphere" REAL NOT NULL,
    "oiMaxCylinder" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LensProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "frameType" TEXT NOT NULL,
    "hasAntiReflective" BOOLEAN NOT NULL DEFAULT false,
    "hasBlueFilter" BOOLEAN NOT NULL DEFAULT false,
    "isPhotochromic" BOOLEAN NOT NULL DEFAULT false,
    "hasUVProtection" BOOLEAN NOT NULL DEFAULT false,
    "isPolarized" BOOLEAN NOT NULL DEFAULT false,
    "isMirrored" BOOLEAN NOT NULL DEFAULT false,
    "costPrice" INTEGER,
    "basePrice" INTEGER NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "deliveryDays" INTEGER NOT NULL,
    "observations" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "prescriptionRangeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LensProduct_prescriptionRangeId_fkey" FOREIGN KEY ("prescriptionRangeId") REFERENCES "PrescriptionRange" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionRange_code_key" ON "PrescriptionRange"("code");

-- CreateIndex
CREATE INDEX "PrescriptionRange_odMaxSphere_odMaxCylinder_oiMaxSphere_oiMaxCylinder_idx" ON "PrescriptionRange"("odMaxSphere", "odMaxCylinder", "oiMaxSphere", "oiMaxCylinder");

-- CreateIndex
CREATE UNIQUE INDEX "LensProduct_sku_key" ON "LensProduct"("sku");

-- CreateIndex
CREATE INDEX "LensProduct_prescriptionRangeId_idx" ON "LensProduct"("prescriptionRangeId");

-- CreateIndex
CREATE INDEX "LensProduct_material_idx" ON "LensProduct"("material");

-- CreateIndex
CREATE INDEX "LensProduct_frameType_idx" ON "LensProduct"("frameType");

-- CreateIndex
CREATE INDEX "LensProduct_available_idx" ON "LensProduct"("available");
