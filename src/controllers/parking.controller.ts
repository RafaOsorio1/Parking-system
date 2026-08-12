import type { NextFunction, Request, Response } from "express";
import { databaseManager } from "../libs/databaseManager";
import { PricingService } from "../libs/pricingService";
import { z } from "zod";

const prisma = databaseManager.getDatabase();

export async function registerEntryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      plate: z.string().min(1),
      vehicleType: z.enum(["CAR", "MOTORCYCLE"]),
      spotNumber: z.string().min(1),
    });

    const bodyParsed = schema.safeParse(req.body);

    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const { plate, vehicleType, spotNumber } = bodyParsed.data;

    // 1. Check if spot exists and is available
    const spot = await prisma.parkingSpot.findUnique({
      where: { number: spotNumber },
    });

    if (!spot) {
      res.status(404).json({ message: "Spot not found" });
      return;
    }

    if (spot.status !== "AVAILABLE") {
      res.status(400).json({ message: "Spot is not available" });
      return;
    }

    if (spot.type !== vehicleType) {
      res.status(400).json({
        message: `Spot ${spotNumber} is for ${spot.type}, not for ${vehicleType}`,
      });
      return;
    }

    // 2. Check for active membership
    const membership = await prisma.membership.findFirst({
      where: {
        vehicle: { plate },
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
    });

    // 3. Find active rate for this vehicle type (only if not a member)
    let rateId: string | null = null;
    if (!membership) {
      const rate = await prisma.parkingRate.findFirst({
        where: { vehicleType, isActive: true },
        orderBy: { createdAt: "desc" },
      });

      if (!rate) {
        res
          .status(400)
          .json({ message: "No active rate found for this vehicle type" });
        return;
      }
      rateId = rate.id;
    }

    // 4. Find or create vehicle
    let vehicle = await prisma.vehicle.findUnique({
      where: { plate },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { plate, type: vehicleType },
      });
    }

    // 5. Create Ticket and update spot status
    const result = await prisma.$transaction(async (tx: any) => {
      const ticket = await tx.ticket.create({
        data: {
          vehicleId: vehicle!.id,
          spotId: spot.id,
          rateId: rateId,
          status: "ACTIVE",
        },
      });

      await tx.parkingSpot.update({
        where: { id: spot.id },
        data: { status: "OCCUPIED" },
      });

      return tx.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          vehicle: true,
          spot: true,
          rate: true,
        },
      });
    });

    res.status(201).json({
      status: "success",
      data: {
        ...result,
        isMembership: !!membership,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerExitController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      plate: z.string().min(1),
    });

    const bodyParsed = schema.safeParse(req.body);

    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const { plate } = bodyParsed.data;

    // 1. Find active ticket for this plate
    const ticket = await prisma.ticket.findFirst({
      where: {
        vehicle: { plate },
        status: "ACTIVE",
      },
      include: {
        spot: true,
        rate: true,
      },
    });

    if (!ticket) {
      res
        .status(404)
        .json({ message: "No active ticket found for this vehicle" });
      return;
    }

    // 2. Calculate fee
    const exitTime = new Date();
    let fee = 0;

    if (ticket.rate) {
      fee = PricingService.calculateFee(
        ticket.entryTime,
        exitTime,
        ticket.rate,
      );
    } else {
      // Membership logic: check if still valid just in case
      const membership = await prisma.membership.findFirst({
        where: {
          vehicleId: ticket.vehicleId,
          status: "ACTIVE",
          endDate: { gte: new Date() },
        },
      });

      if (!membership) {
        // This is a rare edge case: membership expired while inside.
        // Depending on policy, we might charge something or just let them out.
        // For now, let's keep it 0 as they entered as members.
        fee = 0;
      }
    }

    // 3. Find active cash session
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: "OPEN" },
    });

    // 4. Update ticket and spot status
    const result = await prisma.$transaction(async (tx: any) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          exitTime,
          fee,
          status: "COMPLETED",
          cashSessionId: activeSession?.id || null,
        },
      });

      await tx.parkingSpot.update({
        where: { id: ticket.spotId },
        data: { status: "AVAILABLE" },
      });

      return tx.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          vehicle: true,
          spot: true,
          rate: true,
        },
      });
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveTicketsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { status: "ACTIVE" },
      include: {
        vehicle: true,
        spot: true,
        rate: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
}
