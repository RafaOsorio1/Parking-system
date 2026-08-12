import { PrismaClient } from "@prisma/client";
import { logger } from "../middlewares/logger";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    logger.info("⌛️ - Connecting to the database...");
    try {
      await this.prisma.$connect();
      logger.info("✅ - Connected to database");
    } catch (error) {
      logger.error("❌ - Error connecting to the database:", error);
    }
  }

  public async disconnect(): Promise<void> {
    logger.info("⌛️ - Disconnecting from the database...");
    try {
      await this.prisma.$disconnect();
      logger.info("✅ - Disconnected from database");
    } catch (error) {
      logger.error("❌ - Error disconnecting from the database:", error);
    }
  }

  public getDatabase(): PrismaClient {
    return this.prisma;
  }
}

export const databaseManager = DatabaseManager.getInstance();
