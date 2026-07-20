import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext.jsx";
import { notificationKeys } from "../hooks/api/useNotifications.js";
import { chatKeys } from "../hooks/api/useChat.js";
import { walletKeys } from "../hooks/api/useWallet.js";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined; // undefined = same origin

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setOnlineUserIds(new Set());
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("presence:snapshot", (ids) => setOnlineUserIds(new Set(ids)));
    socket.on("presence:update", ({ userId, online }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    // A notification landed (application update, hire, message, payment,
    // etc.) - refresh the bell badge / dropdown / history everywhere.
    socket.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    // Someone messaged this user - refresh the conversation list (unread
    // counts, ordering) even if they're not currently on the chat page.
    socket.on("conversation:updated", () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    });

    // Escrow funded/released/refunded, or a withdrawal was settled -
    // refresh balance/transactions everywhere so the wallet dashboard
    // updates automatically, without waiting for a manual refresh.
    socket.on("wallet:updated", () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      getSocket: () => socketRef.current,
      onlineUserIds,
      isUserOnline: (userId) => onlineUserIds.has(String(userId)),
    }),
    [onlineUserIds]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}
