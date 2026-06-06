import { io } from 'socket.io-client';

let socket;

export function connectSocket(userId) {
  if (socket && socket.connected) return socket;
  socket = io({ auth: { userId }, transports: ['websocket', 'polling'] });
  return socket;
}

export function getSocket() {
  return socket;
}
