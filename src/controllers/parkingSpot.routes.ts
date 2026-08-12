import { Router } from "express";
import { IRoutes } from "../routes";
import {
  createSpotController,
  getAllSpotsController,
  getOccupancyMapController,
} from "./parkingSpot.controller";

export default class ParkingSpotRoutes implements IRoutes {
  readonly name = "ParkingSpot";
  readonly router: Router = Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes(): void {
    this.router.get("/", getAllSpotsController);
    this.router.get("/occupancy", getOccupancyMapController);
    this.router.post("/", createSpotController);
  }
}
