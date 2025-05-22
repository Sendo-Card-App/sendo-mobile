import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io('https://api.sf-e.ca/api', {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const getSocket = () => socket;