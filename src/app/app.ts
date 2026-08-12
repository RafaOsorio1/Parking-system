import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { logger } from "../middlewares/logger";
import { initRestRoutes } from "../routes";

export class Application {
  public readonly app: express.Application;

  constructor() {
    this.app = express();
    this.configureCore();
  }

  private configureCore(): void {
    this.app.use(
      cors({
        origin: [process.env.CLIENT_URL || "http://127.0.0.1:5173", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
      }),
    );

    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      logger.info(`📥 ${req.method} ${req.path}`);
      next();

      res.on("finish", () => {
        logger.info(`📤 ${req.method} ${req.path} - ${res.statusCode}`);
      });
    });
  }

  public initRestRoutes(): void {
    initRestRoutes(this.app);
  }

  public enableStatic(path: string): void {
    this.app.use(express.static(path));
  }
}
