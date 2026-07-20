import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import { parseCookieHeader } from "../utils/parseCookies.js";
import { addSocket, removeSocket, getOnlineUserIds } from "./presence.js";

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Identifies the connecting socket using the same httpOnly accessToken
  // cookie the REST API trusts, so a client never has to (and can't spoof)
  // manually declaring who they are. An expired/missing token just means
  // an anonymous socket - it can still join public rooms, it just won't
  // receive anything addressed to a specific user.
  io.use((socket, next) => {
    try {
      const cookies = parseCookieHeader(socket.handshake.headers.cookie);
      const token = cookies.accessToken;
      if (token) {
        const decoded = verifyAccessToken(token);
        socket.userId = String(decoded.id);
      }
    } catch {
      // Invalid/expired token - treat the connection as anonymous.
    }
    next();
  });

  io.on("connection", (socket) => {
    const { userId } = socket;
    console.log(`[socket] client connected: ${socket.id}${userId ? ` (user ${userId})` : ""}`);

    if (userId) {
      socket.join(`user:${userId}`);

      const cameOnline = addSocket(userId, socket.id);
      if (cameOnline) {
        io.emit("presence:update", { userId, online: true });
      }
      // Let this socket know who else is online right now (it just missed
      // any presence:update events broadcast before it connected).
      socket.emit("presence:snapshot", getOnlineUserIds());
    }

    // --- Chat conversation rooms ---
    socket.on("conversation:join", (conversationId) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    });
    socket.on("conversation:leave", (conversationId) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });

    // --- Typing indicator ---
    socket.on("typing:start", ({ conversationId } = {}) => {
      if (!conversationId || !userId) return;
      socket.to(`conversation:${conversationId}`).emit("typing", { conversationId, userId, isTyping: true });
    });
    socket.on("typing:stop", ({ conversationId } = {}) => {
      if (!conversationId || !userId) return;
      socket.to(`conversation:${conversationId}`).emit("typing", { conversationId, userId, isTyping: false });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
      if (userId) {
        const wentOffline = removeSocket(userId, socket.id);
        if (wentOffline) io.emit("presence:update", { userId, online: false });
      }
    });
  });

  return io;
}

export default initSockets;
