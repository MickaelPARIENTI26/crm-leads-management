/*
  Warnings:

  - Added the required column `codePostal` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('PV', 'ITE', 'PAC');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "codePostal" TEXT NOT NULL,
ADD COLUMN     "type" "LeadType" NOT NULL;
