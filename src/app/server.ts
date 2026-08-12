import http from "http";
import { logger } from "../middlewares/logger";
import { Application } from "./app";

export class Server {
  private readonly app: Application;
  private readonly port: number;
  public httpServer: http.Server;

  constructor(application: Application, port: number) {
    this.app = application;
    this.port = port;

    this.httpServer = http.createServer(this.app.app);

    this.app.initRestRoutes();
  }

  public start(): void {
    this.httpServer.listen(this.port, () => {
      logger.info(`🚀 Server running on http://localhost:${this.port}`);
    });
  }
}
