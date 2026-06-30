-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AcademicLevel" ADD VALUE 'ECD_A';
ALTER TYPE "AcademicLevel" ADD VALUE 'ECD_B';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_1';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_2';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_3';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_4';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_5';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_6';
ALTER TYPE "AcademicLevel" ADD VALUE 'GRADE_7';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "customLabel" TEXT;

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_custom_categories" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_custom_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_label_key" ON "expense_categories"("label");

-- CreateIndex
CREATE UNIQUE INDEX "payment_custom_categories_label_key" ON "payment_custom_categories"("label");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
