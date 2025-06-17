/*
  Warnings:

  - You are about to drop the column `value` on the `Measurement` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Measurement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Measurement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Measurement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Measurement" DROP COLUMN "value",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;
