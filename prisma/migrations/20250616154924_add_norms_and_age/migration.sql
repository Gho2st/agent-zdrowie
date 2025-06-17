/*
  Warnings:

  - Made the column `age` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `diastolicMax` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `diastolicMin` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `glucoseMax` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `glucoseMin` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `systolicMax` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `systolicMin` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weightMax` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weightMin` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "age" SET NOT NULL,
ALTER COLUMN "diastolicMax" SET NOT NULL,
ALTER COLUMN "diastolicMin" SET NOT NULL,
ALTER COLUMN "glucoseMax" SET NOT NULL,
ALTER COLUMN "glucoseMin" SET NOT NULL,
ALTER COLUMN "systolicMax" SET NOT NULL,
ALTER COLUMN "systolicMin" SET NOT NULL,
ALTER COLUMN "weightMax" SET NOT NULL,
ALTER COLUMN "weightMin" SET NOT NULL;
