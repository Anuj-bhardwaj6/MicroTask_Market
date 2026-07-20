import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSockets } from "./sockets/index.js";

const httpServer = http.createServer(app);
const io = initSockets(httpServer);
app.set("io", io);

async function start() {
  await connectDB();

  httpServer.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start();

process.on("unhandledRejection", (err) => {
  console.error("[server] unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("[server] uncaught exception:", err);
});
