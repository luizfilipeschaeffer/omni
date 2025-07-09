"use client";
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

export interface Notification {
  id: string;
  text: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (text: string) => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearReadNotifications: () => void;
}

export const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  deleteNotification: () => {},
  markAllAsRead: () => {},
  clearReadNotifications: () => {},
});

const STORAGE_KEY = "notificacoes";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[] | undefined>(undefined);

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications([]);
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (notifications !== undefined) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  const addNotification = useCallback((text: string) => {
    setNotifications((prev) => [
      ...(prev ?? []),
      {
        id: `${Date.now()}-${Math.random()}`,
        text,
        read: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => (prev ?? []).filter((n) => n.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications((prev) => (prev ?? []).filter((n) => !n.read));
  }, []);

  if (notifications === undefined) {
    // Evita renderizar filhos até carregar do localStorage
    return null;
  }

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, deleteNotification, markAllAsRead, clearReadNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
} 