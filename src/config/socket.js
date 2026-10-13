// Keep each Socket.IO session on one PM2 worker; polling requires sticky sessions.
export const SOCKET_TRANSPORTS = ['websocket'];
