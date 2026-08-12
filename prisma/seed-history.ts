import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando el poblado de datos realistas...");

  // 1. Limpiar datos previos (Opcional, ten cuidado)
  // await prisma.ticket.deleteMany();
  // await prisma.cashSession.deleteMany();

  // 2. Asegurar que existan tarifas
  let carRate = await prisma.parkingRate.findFirst({
    where: { vehicleType: "CAR", isActive: true },
  });
  if (!carRate) {
    carRate = await prisma.parkingRate.create({
      data: {
        name: "Tarifa Estándar Carro",
        vehicleType: "CAR",
        baseFee: 3000,
        baseTimeMinutes: 30,
        hourlyRate: 5000,
        isActive: true,
      },
    });
  }

  let bikeRate = await prisma.parkingRate.findFirst({
    where: { vehicleType: "MOTORCYCLE", isActive: true },
  });
  if (!bikeRate) {
    bikeRate = await prisma.parkingRate.create({
      data: {
        name: "Tarifa Estándar Moto",
        vehicleType: "MOTORCYCLE",
        baseFee: 1500,
        baseTimeMinutes: 30,
        hourlyRate: 2500,
        isActive: true,
      },
    });
  }

  // 3. Asegurar que existan espacios
  const spots = await prisma.parkingSpot.findMany();
  if (spots.length === 0) {
    await prisma.parkingSpot.createMany({
      data: [
        { number: "A1", type: "CAR" },
        { number: "A2", type: "CAR" },
        { number: "A3", type: "CAR" },
        { number: "B1", type: "MOTORCYCLE" },
        { number: "B2", type: "MOTORCYCLE" },
      ],
    });
  }

  // 4. Crear Historial de Sesiones de Caja (Últimos 5 días)
  const days = 5;
  for (let i = days; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Abrir turno a las 8:00 AM
    const openingTime = new Date(date);
    openingTime.setHours(8, 0, 0);

    // Cerrar turno a las 6:00 PM
    const closingTime = new Date(date);
    closingTime.setHours(18, 0, 0);

    const initialAmount = 50000; // Base de 50k

    // Crear la sesión
    const session = await prisma.cashSession.create({
      data: {
        openingTime,
        closingTime,
        initialAmount,
        status: "CLOSED",
        notes: `Turno del día -${i} completado sin novedades.`,
      },
    });

    // 5. Crear Tickets para esta sesión
    const numTickets = Math.floor(Math.random() * 15) + 5; // Entre 5 y 20 tickets por día
    let totalIncome = 0;

    for (let j = 0; j < numTickets; j++) {
      const isCar = Math.random() > 0.4;
      const plate = `${(Math.random() + 1).toString(36).substring(2, 5).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`;

      // Asegurar vehículo existe
      const vehicle = await prisma.vehicle.upsert({
        where: { plate },
        update: {},
        create: { plate, type: isCar ? "CAR" : "MOTORCYCLE" },
      });

      // Tiempo de estancia entre 30 min y 5 horas
      const stayMinutes = Math.floor(Math.random() * 270) + 30;
      const ticketEntry = new Date(openingTime);
      ticketEntry.setMinutes(ticketEntry.getMinutes() + j * 30); // Escalonados
      const ticketExit = new Date(ticketEntry);
      ticketExit.setMinutes(ticketExit.getMinutes() + stayMinutes);

      const rate = isCar ? carRate : bikeRate;
      const fee = rate.baseFee + Math.ceil(stayMinutes / 60) * rate.hourlyRate;

      await prisma.ticket.create({
        data: {
          vehicleId: vehicle.id,
          spotId:
            (
              await prisma.parkingSpot.findFirst({
                where: { type: isCar ? "CAR" : "MOTORCYCLE" },
              })
            )?.id || "",
          rateId: rate.id,
          cashSessionId: session.id,
          entryTime: ticketEntry,
          exitTime: ticketExit,
          fee,
          status: "COMPLETED",
        },
      });

      totalIncome += fee;
    }

    // Actualizar la sesión con los totales calculados
    const expectedAmount = initialAmount + totalIncome;
    const actualAmount =
      Math.random() > 0.8 ? expectedAmount - 2000 : expectedAmount; // Simular un descuadre ocasional

    await prisma.cashSession.update({
      where: { id: session.id },
      data: {
        totalIncome,
        expectedAmount,
        actualAmount,
        difference: actualAmount - expectedAmount,
      },
    });
  }

  console.log(
    "✅ Base de datos poblada con éxito. Revisa el historial de arqueos.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
