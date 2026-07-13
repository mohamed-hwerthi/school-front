import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

export interface RealtimeNotification {
  id: string;
  type: "ABSENCE" | "NOTE" | "PAIEMENT" | "INSCRIPTION" | "SYSTEM" | "DISCIPLINE" | "EXAMEN" | "DEVOIR";
  title: string;
  message: string;
  link?: string;
  timestamp: string;
  read: boolean;
}

export function useNotificationsRealtime() {
  const { subscribe, connected } = useWebSocket();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  useEffect(() => {
    if (!connected) return;

    // Subscribe to personal notifications queue
    const unsubPersonal = subscribe(
      "/user/queue/notifications",
      (msg: unknown) => {
        const notification = msg as RealtimeNotification;
        setNotifications((prev) => [notification, ...prev]);
      }
    );

    // Subscribe to broadcast notifications topic
    const unsubBroadcast = subscribe(
      "/topic/notifications",
      (msg: unknown) => {
        const notification = msg as RealtimeNotification;
        setNotifications((prev) => [notification, ...prev]);
      }
    );

    return () => {
      unsubPersonal();
      unsubBroadcast();
    };
  }, [connected, subscribe]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    connected,
  };
}
