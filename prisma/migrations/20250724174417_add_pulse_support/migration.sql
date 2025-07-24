/*
  Warnings:

  - The `amount` column on the `Measurement` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Measurement" DROP COLUMN "amount",
ADD COLUMN     "amount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pulseMax" INTEGER,
ADD COLUMN     "pulseMin" INTEGER;
