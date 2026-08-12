import type { NextFunction, Request, Response } from "express";
import { databaseManager } from "../libs/databaseManager";
import { z } from "zod";

const prisma = databaseManager.getDatabase();

export async function createRateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      vehicleType: z.enum(["CAR", "MOTORCYCLE"]),
      baseFee: z.number().min(0),
      baseTimeMinutes: z.number().min(0),
      hourlyRate: z.number().min(0),
      dailyMax: z.number().optional(),
      makeActive: z.boolean().optional().default(true),
    });

    const bodyParsed = schema.safeParse(req.body);

    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const { makeActive, ...rateData } = bodyParsed.data;

    const result = await prisma.$transaction(async (tx: any) => {
      // If this new rate should be the active one, deactivate others of the same type
      if (makeActive) {
        await tx.parkingRate.updateMany({
          where: { vehicleType: rateData.vehicleType, isActive: true },
          data: { isActive: false },
        });
      }

      return await tx.parkingRate.create({
        data: {
          ...rateData,
          isActive: makeActive,
        },
      });
    });

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRatesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rates = await prisma.parkingRate.findMany({
      where: { isActive: true },
    });

    res.status(200).json({
      status: "success",
      data: rates,
    });
  } catch (error) {
    next(error);
  }
}
export async function updateRateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().min(1).optional(),
      baseFee: z.number().min(0).optional(),
      baseTimeMinutes: z.number().min(0).optional(),
      hourlyRate: z.number().min(0).optional(),
      dailyMax: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
    });

    const bodyParsed = schema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const updateData = bodyParsed.data;

    const result = await prisma.$transaction(async (tx: any) => {
      // If setting this rate as active, deactivate others of the same type
      if (updateData.isActive) {
        const currentRate = await tx.parkingRate.findUnique({ where: { id } });
        if (currentRate) {
          await tx.parkingRate.updateMany({
            where: { vehicleType: currentRate.vehicleType, isActive: true },
            data: { isActive: false },
          });
        }
      }

      return await tx.parkingRate.update({
        where: { id },
        data: updateData,
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
