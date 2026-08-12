import dotenv from "dotenv";
dotenv.config();

import { Application } from "./app/app";
import { Server } from "./app/server";
import { databaseManager } from "./libs/databaseManager";

async function main() {
  await databaseManager.connect();

  const app = new Application();
  const server = new Server(app, Number(process.env.PORT) || 3000);

  server.start();

  process.on("SIGINT", async () => {
    await databaseManager.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await databaseManager.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
