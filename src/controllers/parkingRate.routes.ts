import { Router } from "express";
import { IRoutes } from "../routes";
import {
  createRateController,
  getRatesController,
  updateRateController,
} from "./parkingRate.controller";

export default class ParkingRateRoutes implements IRoutes {
  readonly name = "ParkingRate";
  readonly router: Router = Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes(): void {
    this.router.get("/", getRatesController);
    this.router.post("/", createRateController);
    this.router.put("/:id", updateRateController);
  }
}
