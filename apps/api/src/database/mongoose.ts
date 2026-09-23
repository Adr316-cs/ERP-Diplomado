import mongoose from "mongoose";
import { logger } from "../observability/logger.js";

export type DatabaseStatus = "disabled" | "connecting" | "connected" | "disconnected" | "error";

let databaseStatus: DatabaseStatus = "disconnected";

export const getDatabaseStatus = (): DatabaseStatus => databaseStatus;

export const connectDatabase = async (uri: string): Promise<void> => {
  if (uri.length === 0) {
    databaseStatus = "disabled";
    logger.warn("MongoDB no está configurado; la conexión permanece deshabilitada");
    return;
  }

  databaseStatus = "connecting";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
    databaseStatus = "connected";
    logger.info("Conexión con MongoDB establecida");
  } catch (error) {
    databaseStatus = "error";
    logger.error({ err: error }, "No fue posible conectar con MongoDB");
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  databaseStatus = "disconnected";
};