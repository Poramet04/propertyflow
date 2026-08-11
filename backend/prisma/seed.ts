import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AppointmentStatus,
  LeadActivityType,
  LeadPriority,
  LeadStatus,
  LoanApplicationStatus,
  PrismaClient,
  PropertyStatus,
  PropertyType,
  Role,
} from "@prisma/client";
import { properties } from "../src/data.js";

const prisma = new PrismaClient();
const customerNames = [
  "Chanya Customer",
  "Mali Buyer",
  "Krit Buyer",
  "Nok Buyer",
  "Ton Buyer",
  "Ploy Buyer",
  "Beam Buyer",
  "Fah Buyer",
  "Win Buyer",
  "May Buyer",
  "Aom Buyer",
  "Pete Buyer",
];
const users = [
  ...customerNames.map((name, index) => ({
    name,
    email:
      index === 0
        ? "customer@propertyflow.dev"
        : index === 1
          ? "mali@propertyflow.dev"
          : `${name.split(" ")[0]!.toLowerCase()}@propertyflow.dev`,
    phone: `08010000${String(index + 1).padStart(2, "0")}`,
    password: "Customer123!",
    role: Role.CUSTOMER,
  })),
  {
    name: "Arun Agent",
    email: "agent@propertyflow.dev",
    phone: "0802000001",
    password: "Agent123!",
    role: Role.AGENT,
  },
  {
    name: "Pim Agent",
    email: "agent2@propertyflow.dev",
    phone: "0802000002",
    password: "Agent123!",
    role: Role.AGENT,
  },
  {
    name: "Korn Agent",
    email: "agent3@propertyflow.dev",
    phone: "0802000003",
    password: "Agent123!",
    role: Role.AGENT,
  },
  {
    name: "Nalin Admin",
    email: "admin@propertyflow.dev",
    phone: "0803000001",
    password: "Admin123!",
    role: Role.ADMIN,
  },
];
const stages = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.VIEWING,
  LeadStatus.NEGOTIATION,
  LeadStatus.BOOKING,
  LeadStatus.CLOSED,
  LeadStatus.LOST,
];
const priorities = [
  LeadPriority.HOT,
  LeadPriority.HIGH,
  LeadPriority.MEDIUM,
  LeadPriority.LOW,
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        phone: user.phone,
        role: user.role,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        passwordHash,
      },
    });
  }
  for (const p of properties)
    await prisma.property.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        location: p.location,
        province: p.province,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: p.areaSqm,
        propertyType: p.propertyType as PropertyType,
        featured: p.featured,
        amenities: p.amenities,
        images: {
          deleteMany: {},
          create: p.images.map((imageUrl, order) => ({ imageUrl, order })),
        },
      },
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        location: p.location,
        province: p.province,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: p.areaSqm,
        propertyType: p.propertyType as PropertyType,
        featured: p.featured,
        amenities: p.amenities,
        images: {
          create: p.images.map((imageUrl, order) => ({ imageUrl, order })),
        },
      },
    });
  const primary = await prisma.user.findUniqueOrThrow({
    where: { email: "customer@propertyflow.dev" },
  });
  await prisma.loanProfile.upsert({
    where: { userId: primary.id },
    update: {
      monthlyIncome: 65000,
      additionalMonthlyIncome: 5000,
      existingDebt: 0,
      creditCardMonthlyPayment: 1200,
      carLoanMonthlyPayment: 4500,
      personalLoanMonthlyPayment: 0,
      otherMonthlyDebt: 800,
      downPayment: 500000,
      interestRate: 5.5,
      loanYears: 30,
      maxDti: 40,
      safetyMin: 85,
      safetyMax: 92,
      estimatedLoanAmount: 3300000,
      estimatedPropertyBudget: 3800000,
    },
    create: {
      userId: primary.id,
      monthlyIncome: 65000,
      additionalMonthlyIncome: 5000,
      existingDebt: 0,
      creditCardMonthlyPayment: 1200,
      carLoanMonthlyPayment: 4500,
      personalLoanMonthlyPayment: 0,
      otherMonthlyDebt: 800,
      downPayment: 500000,
      interestRate: 5.5,
      loanYears: 30,
      maxDti: 40,
      safetyMin: 85,
      safetyMax: 92,
      estimatedLoanAmount: 3300000,
      estimatedPropertyBudget: 3800000,
    },
  });
  await prisma.propertyPreference.upsert({
    where: { userId: primary.id },
    update: {
      preferredLocations: ["Sriracha", "Bangsaen"],
      propertyTypes: [PropertyType.CONDO, PropertyType.HOUSE],
      minBedrooms: 2,
      minBathrooms: 1,
      minArea: 40,
      maxArea: 160,
      maxMonthlyPayment: 18000,
      maxPropertyPrice: 3800000,
    },
    create: {
      userId: primary.id,
      preferredLocations: ["Sriracha", "Bangsaen"],
      propertyTypes: [PropertyType.CONDO, PropertyType.HOUSE],
      minBedrooms: 2,
      minBathrooms: 1,
      minArea: 40,
      maxArea: 160,
      maxMonthlyPayment: 18000,
      maxPropertyPrice: 3800000,
    },
  });
  const customers = await prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
        email: {
          in: users.filter((u) => u.role === Role.CUSTOMER).map((u) => u.email),
        },
      },
      orderBy: { email: "asc" },
    }),
    agents = await prisma.user.findMany({
      where: { role: Role.AGENT },
      orderBy: { email: "asc" },
    }),
    homes = await prisma.property.findMany({ orderBy: { slug: "asc" } });
  for (let i = 0; i < 24; i++) {
    const customer = customers[i % customers.length]!,
      property =
        homes[(i * 5 + Math.floor(i / customers.length)) % homes.length]!,
      agent = agents[i % agents.length]!,
      status = stages[i % stages.length]!;
    let lead = await prisma.lead.findFirst({
      where: { customerId: customer.id, propertyId: property.id },
    });
    const needsFollowUp =
      status === LeadStatus.NEW ||
      status === LeadStatus.CONTACTED ||
      status === LeadStatus.BOOKING;
    const leadData = {
      assignedAgentId: agent.id,
      budget: 1600000 + (i % 8) * 550000,
      phone: customer.phone,
      email: customer.email,
      status,
      priority: priorities[i % priorities.length]!,
      notes:
        i % 3 === 0
          ? "Prefers an evening call. Fictional demonstration lead."
          : "Fictional CRM demonstration lead.",
      nextFollowUpAt: needsFollowUp
        ? new Date(Date.now() + ((i % 4) - 1) * 86400000)
        : null,
      followUpCompletedAt: null,
    };
    lead = lead
      ? await prisma.lead.update({ where: { id: lead.id }, data: leadData })
      : await prisma.lead.create({
          data: {
            customerId: customer.id,
            propertyId: property.id,
            ...leadData,
          },
        });
    const activities = await prisma.leadActivity.count({
      where: { leadId: lead.id },
    });
    if (!activities)
      await prisma.leadActivity.createMany({
        data: [
          {
            leadId: lead.id,
            actorUserId: customer.id,
            type: LeadActivityType.LEAD_CREATED,
            description: `Interest registered for ${property.title}`,
          },
          {
            leadId: lead.id,
            actorUserId: agent.id,
            type: LeadActivityType.AGENT_ASSIGNED,
            description: `Lead assigned to ${agent.name}`,
          },
          ...(status !== LeadStatus.NEW
            ? [
                {
                  leadId: lead.id,
                  actorUserId: agent.id,
                  type: LeadActivityType.STATUS_CHANGED,
                  description: `Lead progressed to ${status}`,
                },
              ]
            : []),
        ],
      });
    if (
      i % 3 === 0 &&
      !(await prisma.appointment.findFirst({ where: { leadId: lead.id } }))
    )
      await prisma.appointment.create({
        data: {
          leadId: lead.id,
          appointmentDate: new Date(Date.now() + (i % 2 ? 3 : -4) * 86400000),
          status:
            i % 2 ? AppointmentStatus.SCHEDULED : AppointmentStatus.COMPLETED,
          note: "Fictional property viewing appointment.",
        },
      });
    if (
      i % 4 === 1 &&
      !(await prisma.loanApplication.findFirst({ where: { leadId: lead.id } }))
    )
      await prisma.loanApplication.create({
        data: {
          leadId: lead.id,
          bankName: [
            "Harbor Demo Bank",
            "Eastern Demo Bank",
            "Chonburi Demo Bank",
          ][i % 3]!,
          requestedLoanAmount: Math.max(
            900000,
            Number(property.price) - 350000,
          ),
          status: [
            LoanApplicationStatus.DOCUMENT_PREPARATION,
            LoanApplicationStatus.SUBMITTED_TO_BANK,
            LoanApplicationStatus.UNDER_REVIEW,
          ][i % 3]!,
          submittedAt: i % 3 ? new Date(Date.now() - 2 * 86400000) : null,
          note: "Fictional application for portfolio demonstration.",
        },
      });
    const existingLeadDeal = await prisma.deal.findUnique({
        where: { leadId: lead.id },
      }),
      existingPropertyDeal = await prisma.deal.findFirst({
        where: { propertyId: property.id },
      });
    if (
      status === LeadStatus.CLOSED &&
      !existingLeadDeal &&
      !existingPropertyDeal
    ) {
      const salePrice = Number(property.price) * 0.98,
        commissionRate = 0.03;
      await prisma.$transaction([
        prisma.deal.create({
          data: {
            leadId: lead.id,
            propertyId: property.id,
            customerId: customer.id,
            agentId: agent.id,
            salePrice,
            commissionRate,
            commissionAmount: salePrice * commissionRate,
            closedAt: new Date(Date.now() - (i % 4) * 86400000),
          },
        }),
        prisma.property.update({
          where: { id: property.id },
          data: { status: PropertyStatus.SOLD },
        }),
      ]);
    }
  }
  console.log(
    `Seeded ${users.length} fictional users, ${properties.length} properties and 24 CRM lead scenarios`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
