import type { NextFunction, Request, Response } from "express";
import { databaseManager } from "../libs/databaseManager";
import { z } from "zod";

const prisma = databaseManager.getDatabase();

export async function openSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      initialAmount: z.number().min(0),
      notes: z.string().optional(),
      openedByName: z.string().min(1, "El nombre del responsable es requerido"),
    });

    const bodyParsed = schema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    // Check if there is already an open session
    const activeSession = await prisma.cashSession.findFirst({
      where: { status: "OPEN" },
    });

    if (activeSession) {
      res.status(400).json({ message: "Ya existe una sesión activa" });
      return;
    }

    const { initialAmount, notes, openedByName } = bodyParsed.data;

    const session = await prisma.cashSession.create({
      data: {
        initialAmount,
        expectedAmount: initialAmount,
        notes,
        openedByName,
        status: "OPEN",
      },
    });

    res.status(201).json({
      status: "success",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await prisma.cashSession.findFirst({
      where: { status: "OPEN" },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!session) {
      res.status(404).json({ message: "No active session found" });
      return;
    }

    // Calculate current expected amount (initial + completed tickets fee)
    const ticketsTotal = await prisma.ticket.aggregate({
      where: {
        cashSessionId: session.id,
        status: "COMPLETED",
      },
      _sum: {
        fee: true,
      },
    });

    const currentExpected = session.initialAmount + (ticketsTotal._sum.fee || 0);

    res.status(200).json({
      status: "success",
      data: {
        ...session,
        currentExpected,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function closeSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const schema = z.object({
      actualAmount: z.number().min(0),
      notes: z.string().optional(),
      closedByName: z.string().min(1, "El nombre de quien cierra es requerido"),
    });

    const bodyParsed = schema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json(bodyParsed.error);
      return;
    }

    const activeSession = await prisma.cashSession.findFirst({
      where: { status: "OPEN" },
    });

    if (!activeSession) {
      res.status(404).json({ message: "No se encontró una sesión activa para cerrar" });
      return;
    }

    const { actualAmount, notes, closedByName } = bodyParsed.data;

    // Final calculation of expected amount
    const ticketsTotal = await prisma.ticket.aggregate({
      where: {
        cashSessionId: activeSession.id,
        status: "COMPLETED",
      },
      _sum: {
        fee: true,
      },
    });

    const expectedAmount = activeSession.initialAmount + (ticketsTotal._sum.fee || 0);
    const totalIncome = ticketsTotal._sum.fee || 0;
    const difference = actualAmount - expectedAmount;

    const closedSession = await prisma.cashSession.update({
      where: { id: activeSession.id },
      data: {
        closingTime: new Date(),
        actualAmount,
        expectedAmount,
        totalIncome,
        difference,
        closedByName,
        notes: notes || activeSession.notes,
        status: "CLOSED",
      },
    });

    res.status(200).json({
      status: "success",
      data: closedSession,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionsHistoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const history = await prisma.cashSession.findMany({
      where: { status: "CLOSED" },
      orderBy: { closingTime: "desc" },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
      take: 20,
    });

    res.status(200).json({
      status: "success",
      data: history,
    });
  } catch (error) {
    next(error);
  }
}
