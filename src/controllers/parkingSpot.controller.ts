import type { NextFunction, Request, Response } from "express";
import { databaseManager } from "../libs/databaseManager";
import { z } from "zod";

const prisma = databaseManager.getDatabase();

export async function createSpotController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      number: z.string().min(1),
      type: z.enum(["CAR", "MOTORCYCLE"]),
    });

    const bodyParsed = schema.safeParse(req.body);

    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const result = await prisma.parkingSpot.create({
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

export async function getAllSpotsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const spots = await prisma.parkingSpot.findMany();

    res.status(200).json({
      status: "success",
      data: spots,
    });
  } catch (error) {
    next(error);
  }
}
export async function getOccupancyMapController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const spots = await prisma.parkingSpot.findMany({
      orderBy: { number: "asc" },
      include: {
        tickets: {
          where: { status: "ACTIVE" },
          include: {
            vehicle: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: spots,
    });
  } catch (error) {
    next(error);
  }
}
