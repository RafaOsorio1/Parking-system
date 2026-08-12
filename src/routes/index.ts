import type { Application } from "express";
import { Router } from "express";
import CashRoutes from "../controllers/cash.routes";
import MembershipRoutes from "../controllers/membership.routes";
import ParkingRoutes from "../controllers/parking.routes";
import ParkingRateRoutes from "../controllers/parkingRate.routes";
import ParkingSpotRoutes from "../controllers/parkingSpot.routes";

export interface IRoutes {
  readonly name: string;
  readonly router: Router;

  initRoutes(): void;
  initChildRoutes?(): void;
}

function registerApiRoutes(app: Application, prefix = ""): void {
  app.use(`${prefix}/parking`, new ParkingRoutes().router);
  app.use(`${prefix}/spots`, new ParkingSpotRoutes().router);
  app.use(`${prefix}/rates`, new ParkingRateRoutes().router);
  app.use(`${prefix}/memberships`, new MembershipRoutes().router);
  app.use(`${prefix}/cash`, new CashRoutes().router);
}

export function initRestRoutes(app: Application): void {
  const prefix = "/api";

  app.route("/").all((req, res) => {
    res.send({ status: "OK", data: "Parking API OK" });
  });

  registerApiRoutes(app, prefix);
}
