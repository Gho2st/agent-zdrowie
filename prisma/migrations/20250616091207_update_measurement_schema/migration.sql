-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "diastolic" INTEGER,
ADD COLUMN     "mealContent" TEXT,
ADD COLUMN     "mealTime" TIMESTAMP(3),
ADD COLUMN     "systolic" INTEGER;
