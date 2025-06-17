-- AlterTable
ALTER TABLE "User" ADD COLUMN     "diastolicMax" INTEGER,
ADD COLUMN     "diastolicMin" INTEGER,
ADD COLUMN     "glucoseMax" DOUBLE PRECISION,
ADD COLUMN     "glucoseMin" DOUBLE PRECISION,
ADD COLUMN     "systolicMax" INTEGER,
ADD COLUMN     "systolicMin" INTEGER,
ADD COLUMN     "weightMax" DOUBLE PRECISION,
ADD COLUMN     "weightMin" DOUBLE PRECISION;
