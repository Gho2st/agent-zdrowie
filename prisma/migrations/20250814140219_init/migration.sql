-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "height" INTEGER,
    "weight" DOUBLE PRECISION,
    "diastolicMax" INTEGER,
    "diastolicMin" INTEGER,
    "systolicMax" INTEGER,
    "systolicMin" INTEGER,
    "weightMax" DOUBLE PRECISION,
    "weightMin" DOUBLE PRECISION,
    "glucoseFastingMax" INTEGER,
    "glucoseFastingMin" INTEGER,
    "glucosePostMealMax" INTEGER,
    "glucosePrediabetesFastingMax" INTEGER,
    "glucosePrediabetesFastingMin" INTEGER,
    "bmi" DOUBLE PRECISION,
    "medications" JSONB,
    "birthdate" TIMESTAMP(3),
    "conditions" JSONB,
    "pulseMax" INTEGER,
    "pulseMin" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Measurement" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "diastolic" INTEGER,
    "systolic" INTEGER,
    "context" TEXT,
    "note" TEXT,
    "timing" TEXT,
    "amount" DOUBLE PRECISION,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyCheckin" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mood" TEXT,
    "sleep" TEXT,
    "energy" TEXT,
    "stress" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckin_userId_date_key" ON "public"."DailyCheckin"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."Measurement" ADD CONSTRAINT "Measurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCheckin" ADD CONSTRAINT "DailyCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
