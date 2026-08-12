import { app, BrowserWindow } from "electron";
import * as path from "path";
import isDev from "electron-is-dev";
import { Application } from "./app/app";
import { Server } from "./app/server";
import { databaseManager } from "./libs/databaseManager";

let mainWindow: BrowserWindow | null = null;

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function startBackend() {
  // En desarrollo, ya corremos la API con 'pnpm --filter api dev'
  // así tenemos auto-recarga (hot reload) de la API.
  if (isDev) {
    console.log("🚀 Modo Desarrollo: Conectando a API externa");
    return;
  }

  try {
    await databaseManager.connect();
    const application = new Application();
    const server = new Server(application, Number(process.env.PORT) || 3000);
    server.start();
    console.log("✅ Backend interno iniciado");
  } catch (error) {
    console.error("❌ Fallo al iniciar backend interno:", error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "Parking Pro - Sistema de Gestión",
  });

  if (isDev) {
    mainWindow.loadURL("http://127.0.0.1:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../web/dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", async () => {
  await startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
