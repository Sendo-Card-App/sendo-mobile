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
      forceNew: true
    };

    socket = io(process.env.EXPO_PUBLIC_API_URL || '', options);
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
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