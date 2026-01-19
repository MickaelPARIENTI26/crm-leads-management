-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "dateRdv" TIMESTAMP(3) NOT NULL,
    "heureRdv" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "leadId" TEXT,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum - Add new values first
ALTER TYPE "LeadStatus" ADD VALUE 'A_RAPPELE';
ALTER TYPE "LeadStatus" ADD VALUE 'RDV';

-- Update existing data
UPDATE "Lead" SET status = 'A_RAPPELE' WHERE status = 'A_RAPPELER';
UPDATE "Lead" SET status = 'RDV' WHERE status = 'RDV_PRIS';

-- Note: Can't remove enum values directly in Postgres, but old values won't be used
