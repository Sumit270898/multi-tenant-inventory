import { Server } from 'socket.io';

let io = null;

export function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true },
  });
  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
