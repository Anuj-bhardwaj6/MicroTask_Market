import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  mongoose.connection.on("connected", () => {
    console.log(`[mongo] connected -> ${mongoose.connection.name}`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("[mongo] connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[mongo] disconnected");
  });

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    console.error("[mongo] initial connection failed:", err.message);
    console.error(
      "[mongo] the API will keep running, but any DB-backed route will fail until MongoDB is reachable."
    );
    // We intentionally do not exit the process so the rest of the
    // scaffolded API (health checks, static sample-data-backed routes)
    // keeps working while the DB is being configured.
    return null;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export default connectDB;
