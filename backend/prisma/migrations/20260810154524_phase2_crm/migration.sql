-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'BOOKING', 'CLOSED', 'LOST');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "assignedAgentId" TEXT NOT NULL,
    "budget" DECIMAL(14,2),
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "salePrice" DECIMAL(14,2) NOT NULL,
    "commissionRate" DECIMAL(7,6) NOT NULL,
    "commissionAmount" DECIMAL(14,2) NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_customerId_propertyId_status_idx" ON "Lead"("customerId", "propertyId", "status");

-- CreateIndex
CREATE INDEX "Lead_assignedAgentId_status_idx" ON "Lead"("assignedAgentId", "status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Appointment_leadId_appointmentDate_idx" ON "Appointment"("leadId", "appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_status_idx" ON "Appointment"("appointmentDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_leadId_key" ON "Deal"("leadId");

-- CreateIndex
CREATE INDEX "Deal_agentId_closedAt_idx" ON "Deal"("agentId", "closedAt");

-- CreateIndex
CREATE INDEX "Deal_closedAt_idx" ON "Deal"("closedAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
