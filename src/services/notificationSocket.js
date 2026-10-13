import { io } from 'socket.io-client';
import { API_URL } from '../config/api';

// One authenticated socket per tab for notifications. The server joins it to the
// user's personal room (user:<type>:<id>) from the handshake token, so no
// client-supplied ids are involved. Feature sockets (proctoring, interview room,
// support chat) keep their own connections.
let socket = null;
let socketToken = null;

export function getNotificationSocket(token) {
  if (!token) return null;
  if (socket && socketToken === token) return socket;

  if (socket) socket.disconnect();
  socketToken = token;
  socket = io(API_URL, {
    transports: ['polling', 'websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
    timeout: 10000,
  });
  return socket;
}

export function disconnectNotificationSocket() {
  if (socket) socket.disconnect();
  socket = null;
  socketToken = null;
}
