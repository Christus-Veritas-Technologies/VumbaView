/*
  Warnings:

  - The values [ECD_A,ECD_B,GRADE_1,GRADE_2,GRADE_3,GRADE_4,GRADE_5,GRADE_6,GRADE_7] on the enum `AcademicLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AcademicLevel_new" AS ENUM ('FORM_1', 'FORM_2', 'FORM_3', 'FORM_4', 'FORM_5', 'FORM_6');
ALTER TABLE "level_fee_settings" ALTER COLUMN "level" TYPE "AcademicLevel_new" USING ("level"::text::"AcademicLevel_new");
ALTER TABLE "term_level_fees" ALTER COLUMN "level" TYPE "AcademicLevel_new" USING ("level"::text::"AcademicLevel_new");
ALTER TABLE "students" ALTER COLUMN "level" TYPE "AcademicLevel_new" USING ("level"::text::"AcademicLevel_new");
ALTER TABLE "inquiries" ALTER COLUMN "level" TYPE "AcademicLevel_new" USING ("level"::text::"AcademicLevel_new");
ALTER TYPE "AcademicLevel" RENAME TO "AcademicLevel_old";
ALTER TYPE "AcademicLevel_new" RENAME TO "AcademicLevel";
DROP TYPE "public"."AcademicLevel_old";
COMMIT;
