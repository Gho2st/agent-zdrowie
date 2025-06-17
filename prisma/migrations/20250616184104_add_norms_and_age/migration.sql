/*
  Warnings:

  - You are about to drop the column `diastolicMax` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `diastolicMin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `glucoseMax` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `glucoseMin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `systolicMax` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `systolicMin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weightMax` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weightMin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "diastolicMax",
DROP COLUMN "diastolicMin",
DROP COLUMN "glucoseMax",
DROP COLUMN "glucoseMin",
DROP COLUMN "systolicMax",
DROP COLUMN "systolicMin",
DROP COLUMN "weightMax",
DROP COLUMN "weightMin";
