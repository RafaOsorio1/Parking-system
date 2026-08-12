import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding initial parking rates...");

  const rates = [
    {
      name: "Tarifa Estándar Carro",
      vehicleType: "CAR",
      baseFee: 3000,
      baseTimeMinutes: 60,
      hourlyRate: 3000,
      dailyMax: 30000,
    },
    {
      name: "Tarifa Estándar Moto",
      vehicleType: "MOTORCYCLE",
      baseFee: 1500,
      baseTimeMinutes: 60,
      hourlyRate: 1500,
      dailyMax: 15000,
    },
  ];

  for (const rate of rates) {
    await prisma.parkingRate.upsert({
      where: { id: `default-${rate.vehicleType}` },
      update: rate,
      create: {
        id: `default-${rate.vehicleType}`,
        ...rate,
      },
    });
  }

  console.log("✅ Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
