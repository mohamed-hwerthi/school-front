import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications.api";
import type { Notification } from "@/types/notification";

const NOTIFICATIONS_KEY = "notifications";

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: () => notificationsApi.getAll(),
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: [NOTIFICATIONS_KEY, "unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000, // poll every 30 seconds
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}
