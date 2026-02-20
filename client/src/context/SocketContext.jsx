import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [revisionStock, setRevisionStock] = useState(0);
  const [revisionOrder, setRevisionOrder] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current = socket;

    socket.on('stockUpdated', () => {
      setRevisionStock((s) => s + 1);
    });
    socket.on('orderCreated', () => {
      setRevisionOrder((o) => o + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const value = { revisionStock, revisionOrder };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return ctx;
}
