const onlineUsers = new Map(); // userId (string) -> Set<socketId>

export function addSocket(userId, socketId) {
  const id = String(userId);
  if (!onlineUsers.has(id)) onlineUsers.set(id, new Set());
  const sockets = onlineUsers.get(id);
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  return wasOffline; // true if this is the user's first active connection
}

export function removeSocket(userId, socketId) {
  const id = String(userId);
  const sockets = onlineUsers.get(id);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(id);
    return true; // true if the user just went fully offline
  }
  return false;
}

export function isOnline(userId) {
  return onlineUsers.has(String(userId));
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

export default { addSocket, removeSocket, isOnline, getOnlineUserIds };
