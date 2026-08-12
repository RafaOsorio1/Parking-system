import { Router } from "express";

import { IRoutes } from "../routes";
import {
  createMembershipPlanController,
  getVehicleMembershipController,
  subscribeVehicleController,
} from "./membership.controller";

export default class MembershipRoutes implements IRoutes {
  readonly name = "Membership";
  readonly router: Router = Router();

  constructor() {
    this.initRoutes();
  }

  initRoutes(): void {
    this.router.get("/vehicle/:plate", getVehicleMembershipController);
    this.router.post("/plans", createMembershipPlanController);
    this.router.post("/subscribe", subscribeVehicleController);
  }
}
