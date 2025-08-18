-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "activityLevel" TEXT,
ALTER COLUMN "medications" SET DATA TYPE TEXT,
ALTER COLUMN "conditions" SET DATA TYPE TEXT;
