import type { NextFunction, Request, Response } from "express";
import { databaseManager } from "../libs/databaseManager";
import { z } from "zod";

const prisma = databaseManager.getDatabase();

export async function createMembershipPlanController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      durationDays: z.number().min(1).default(30),
      vehicleType: z.enum(["CAR", "MOTORCYCLE"]),
    });

    const bodyParsed = schema.safeParse(req.body);

    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const result = await prisma.membershipPlan.create({
      data: bodyParsed.data,
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function subscribeVehicleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      plate: z.string().min(1),
      planId: z.string().uuid(),
    });

    const bodyParsed = schema.safeParse(req.body);

    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const { plate, planId } = bodyParsed.data;

    // 1. Find plan
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    // 2. Find or create vehicle
    let vehicle = await prisma.vehicle.findUnique({
      where: { plate },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { plate, type: plan.vehicleType },
      });
    }

    // 3. Create Membership
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const result = await prisma.membership.create({
      data: {
        vehicleId: vehicle.id,
        planId: plan.id,
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicleMembershipController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { plate } = req.params;

    const membership = await prisma.membership.findFirst({
      where: {
        vehicle: { plate: String(plate) },
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}
