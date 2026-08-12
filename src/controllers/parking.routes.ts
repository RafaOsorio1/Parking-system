import { Router } from "express";
import { IRoutes } from "../routes";
import {
  getActiveTicketsController,
  registerEntryController,
  registerExitController,
} from "./parking.controller";

export default class ParkingRoutes implements IRoutes {
  readonly name = "Parking";
  readonly router: Router = Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes(): void {
    this.router.get("/tickets/active", getActiveTicketsController);
    this.router.post("/entry", registerEntryController);
    this.router.post("/exit", registerExitController);
  }
}
