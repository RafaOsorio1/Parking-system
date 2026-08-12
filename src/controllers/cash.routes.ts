import { Router } from "express";
import {
  closeSessionController,
  getActiveSessionController,
  getSessionsHistoryController,
  openSessionController,
} from "./cash.controller";

export default class CashRoutes {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post("/open", openSessionController);
    this.router.get("/active", getActiveSessionController);
    this.router.post("/close", closeSessionController);
    this.router.get("/history", getSessionsHistoryController);
  }
}
