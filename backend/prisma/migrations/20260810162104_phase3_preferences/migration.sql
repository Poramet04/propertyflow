-- AlterTable
ALTER TABLE "LoanProfile" ADD COLUMN     "additionalMonthlyIncome" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "maxDti" DOUBLE PRECISION NOT NULL DEFAULT 40,
ADD COLUMN     "safetyMax" DOUBLE PRECISION NOT NULL DEFAULT 92,
ADD COLUMN     "safetyMin" DOUBLE PRECISION NOT NULL DEFAULT 85;

-- CreateTable
CREATE TABLE "PropertyPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredLocations" TEXT[],
    "propertyTypes" "PropertyType"[],
    "minBedrooms" INTEGER NOT NULL DEFAULT 0,
    "minBathrooms" INTEGER NOT NULL DEFAULT 0,
    "minArea" DOUBLE PRECISION,
    "maxArea" DOUBLE PRECISION,
    "maxMonthlyPayment" DECIMAL(14,2),
    "maxPropertyPrice" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPreference_userId_key" ON "PropertyPreference"("userId");

-- AddForeignKey
ALTER TABLE "PropertyPreference" ADD CONSTRAINT "PropertyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
