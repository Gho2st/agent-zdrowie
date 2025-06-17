/*
  Warnings:

  - You are about to drop the column `mealContent` on the `Measurement` table. All the data in the column will be lost.
  - You are about to drop the column `mealTime` on the `Measurement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Measurement" DROP COLUMN "mealContent",
DROP COLUMN "mealTime",
ADD COLUMN     "context" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "timing" TEXT;
