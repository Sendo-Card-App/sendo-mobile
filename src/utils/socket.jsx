// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface SocketOptions {
  auth: {
    token: string;
  };
  transports: string[];
  autoConnect: boolean;
  forceNew?: boolean;
}

export const initSocket = (token: string): Socket => {
  if (!socket) {
    const options: SocketOptions = {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      forceNew: true,
    };

    // ✅ update the global socket, don’t shadow it
    socket = io('https://api.sf-e.ca', options);

    socket.on('connect', () => {
       console.log("✅ Socket connected:", socket.id);
       console.log(" Auth sent:", socket.io.opts.auth);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message, error);
    });

    socket.on('disconnect', (reason) => {
      console.warn(' Socket disconnected:', reason);
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
