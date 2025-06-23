/*
  Warnings:

  - You are about to drop the column `glucoseMax` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `glucoseMin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "glucoseMax",
DROP COLUMN "glucoseMin",
ADD COLUMN     "glucoseFastingMax" INTEGER,
ADD COLUMN     "glucoseFastingMin" INTEGER,
ADD COLUMN     "glucosePostMealMax" INTEGER,
ADD COLUMN     "glucosePrediabetesFastingMax" INTEGER,
ADD COLUMN     "glucosePrediabetesFastingMin" INTEGER;
