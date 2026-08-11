-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('CONDO', 'HOUSE', 'TOWNHOME', 'VILLA');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'Chonburi',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price" DECIMAL(14,2) NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyIncome" DECIMAL(14,2) NOT NULL,
    "existingDebt" DECIMAL(14,2) NOT NULL,
    "downPayment" DECIMAL(14,2) NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "loanYears" INTEGER NOT NULL,
    "estimatedLoanAmount" DECIMAL(14,2) NOT NULL,
    "estimatedPropertyBudget" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LoanProfile_userId_key" ON "LoanProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_propertyId_key" ON "Favorite"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanProfile" ADD CONSTRAINT "LoanProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
