/*
  Warnings:

  - You are about to drop the column `odMaxCylinder` on the `PrescriptionRange` table. All the data in the column will be lost.
  - You are about to drop the column `odMaxSphere` on the `PrescriptionRange` table. All the data in the column will be lost.
  - You are about to drop the column `oiMaxCylinder` on the `PrescriptionRange` table. All the data in the column will be lost.
  - You are about to drop the column `oiMaxSphere` on the `PrescriptionRange` table. All the data in the column will be lost.
  - Added the required column `maxEyeMaxCylinder` to the `PrescriptionRange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxEyeMaxSphere` to the `PrescriptionRange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minEyeMaxCylinder` to the `PrescriptionRange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minEyeMaxSphere` to the `PrescriptionRange` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrescriptionRange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minEyeMaxSphere" REAL NOT NULL,
    "minEyeMaxCylinder" REAL NOT NULL,
    "maxEyeMaxSphere" REAL NOT NULL,
    "maxEyeMaxCylinder" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- Map old od/oi fields to new minEye/maxEye fields
-- For symmetry: od -> minEye, oi -> maxEye (preserving existing data structure)
INSERT INTO "new_PrescriptionRange" ("code", "createdAt", "description", "id", "updatedAt", "minEyeMaxSphere", "minEyeMaxCylinder", "maxEyeMaxSphere", "maxEyeMaxCylinder")
SELECT "code", "createdAt", "description", "id", "updatedAt", "odMaxSphere", "odMaxCylinder", "oiMaxSphere", "oiMaxCylinder" FROM "PrescriptionRange";
DROP TABLE "PrescriptionRange";
ALTER TABLE "new_PrescriptionRange" RENAME TO "PrescriptionRange";
CREATE UNIQUE INDEX "PrescriptionRange_code_key" ON "PrescriptionRange"("code");
CREATE INDEX "PrescriptionRange_minEyeMaxSphere_minEyeMaxCylinder_maxEyeMaxSphere_maxEyeMaxCylinder_idx" ON "PrescriptionRange"("minEyeMaxSphere", "minEyeMaxCylinder", "maxEyeMaxSphere", "maxEyeMaxCylinder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
