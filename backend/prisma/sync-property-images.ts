import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { properties } from "../src/data.js";

const prisma = new PrismaClient();

async function main() {
  for (const property of properties) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.property.findUnique({
        where: { slug: property.slug },
        select: { id: true },
      });
      if (!existing) {
        throw new Error(`Property not found: ${property.slug}`);
      }

      await tx.propertyImage.deleteMany({
        where: { propertyId: existing.id },
      });
      await tx.propertyImage.createMany({
        data: property.images.map((imageUrl, order) => ({
          propertyId: existing.id,
          imageUrl,
          order,
        })),
      });
    });
  }

  console.log(`Updated galleries for ${properties.length} properties.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Image sync failed");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
