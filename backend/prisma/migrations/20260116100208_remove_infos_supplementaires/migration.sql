-- AlterTable - Make systemeChauffage optional and remove informationsSupplementaires
ALTER TABLE "Lead" ALTER COLUMN "systemeChauffage" DROP NOT NULL;
ALTER TABLE "Lead" DROP COLUMN "informationsSupplementaires";
