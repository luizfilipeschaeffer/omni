"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type ExpressMessageType = "info" | "success" | "warning" | "error";

export interface ExpressMessage {
  id: string;
  title: string;
  body: string;
  type: ExpressMessageType;
  scheduledAt: string; // ISO string
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  createdAt: string;
  active: boolean;
  systemNotified?: boolean;
}

interface ExpressMessageContextType {
  message: ExpressMessage | null;
  showExpressMessage: (msg: Omit<ExpressMessage, "id" | "createdAt" | "active" | "systemNotified">) => void;
  closeExpressMessage: () => void;
  clearRecurrence: () => void;
}

const ExpressMessageContext = createContext<ExpressMessageContextType>({
  message: null,
  showExpressMessage: () => {},
  closeExpressMessage: () => {},
  clearRecurrence: () => {},
});

const STORAGE_KEY = "express_message";

function getNextOccurrence(date: Date, recurrence: ExpressMessage["recurrence"]) {
  const next = new Date(date);
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
}

export function ExpressMessageProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<ExpressMessage | null>(null);

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const msg: ExpressMessage = JSON.parse(saved);
      setMessage(msg);
    }
  }, []);

  // Persistir no localStorage
  useEffect(() => {
    if (message) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [message]);

  // Agendamento e recorrência
  useEffect(() => {
    if (!message) return;
    if (message.active) return;
    const now = new Date();
    const scheduled = new Date(message.scheduledAt);
    if (now >= scheduled) {
      setMessage((prev) => prev ? { ...prev, active: true } : prev);
    } else {
      const timeout = setTimeout(() => {
        setMessage((prev) => prev ? { ...prev, active: true } : prev);
      }, scheduled.getTime() - now.getTime());
      return () => clearTimeout(timeout);
    }
  }, [message?.scheduledAt, message?.active]);

  // Web Notification API
  useEffect(() => {
    if (!message || !message.active || message.systemNotified) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(message.title, { body: message.body });
        setMessage((prev) => prev ? { ...prev, systemNotified: true } : prev);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(message.title, { body: message.body });
            setMessage((prev) => prev ? { ...prev, systemNotified: true } : prev);
          }
        });
      }
    }
  }, [message]);

  // Recorrência: ao fechar, agenda próxima ocorrência se necessário
  const closeExpressMessage = useCallback(() => {
    setMessage((prev) => {
      if (!prev) return null;
      if (prev.recurrence && prev.recurrence !== "none") {
        const nextDate = getNextOccurrence(new Date(prev.scheduledAt), prev.recurrence);
        return {
          ...prev,
          scheduledAt: nextDate.toISOString(),
          active: false,
          systemNotified: false,
        };
      }
      return null;
    });
  }, []);

  // Limpar recorrência manualmente
  const clearRecurrence = useCallback(() => {
    setMessage(null);
  }, []);

  // Função global para disparar mensagem expresso
  const showExpressMessage = useCallback((msg: Omit<ExpressMessage, "id" | "createdAt" | "active" | "systemNotified">) => {
    setMessage({
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      active: false,
      systemNotified: false,
    });
  }, []);

  return (
    <ExpressMessageContext.Provider value={{ message, showExpressMessage, closeExpressMessage, clearRecurrence }}>
      {children}
    </ExpressMessageContext.Provider>
  );
}

export function useExpressMessage() {
  return useContext(ExpressMessageContext);
} 