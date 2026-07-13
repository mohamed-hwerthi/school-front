import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Loader2,
  DollarSign,
  UserX,
  BookOpen,
  ShieldAlert,
  Info,
  AlertTriangle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import type { Notification, NotificationType } from "@/types/notification";
import { notify } from "@/lib/toast";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  INFO: Info,
  WARNING: AlertTriangle,
  ALERT: AlertCircle,
  FINANCE: DollarSign,
  ABSENCE: UserX,
  NOTE: BookOpen,
  DISCIPLINE: ShieldAlert,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-orange-100 text-orange-700",
  ALERT: "bg-red-100 text-red-700",
  FINANCE: "bg-emerald-100 text-emerald-700",
  ABSENCE: "bg-rose-100 text-rose-700",
  NOTE: "bg-purple-100 text-purple-700",
  DISCIPLINE: "bg-yellow-100 text-yellow-700",
};

function groupByDate(notifications: Notification[], t: (key: string) => string): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifications) {
    const dateStr = new Date(n.createdAt).toDateString();
    let label: string;
    if (dateStr === today) {
      label = t("common.today");
    } else if (dateStr === yesterday) {
      label = t("common.yesterday");
    } else {
      label = new Date(n.createdAt).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return groups;
}

export default function NotificationsPage() {
  const { t } = useLanguage();

  const TYPE_LABELS: Record<NotificationType, string> = useMemo(() => ({
    INFO: t("notifications.types.grade"),
    WARNING: t("notifications.severities.warning"),
    ALERT: t("notifications.severities.alert"),
    FINANCE: t("notifications.types.finance"),
    ABSENCE: t("notifications.types.absence"),
    NOTE: t("notifications.types.grade"),
    DISCIPLINE: t("notifications.types.discipline"),
  }), [t]);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return notifications;
    return notifications.filter((n) => n.type === typeFilter);
  }, [notifications, typeFilter]);

  const grouped = useMemo(() => groupByDate(filtered, t), [filtered, t]);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id, {
      onError: () => notify.error(t("notifications.markError")),
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => notify.success(t("notifications.allRead")),
      onError: () => notify.error(t("common.error")),
    });
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id, {
      onSuccess: () => notify.success(t("notifications.deleted")),
      onError: () => notify.error(t("notifications.deleteError")),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("notifications.title")}</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} ${t("notifications.title").toLowerCase()}`
              : t("notifications.noUnread")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("notifications.filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.allTypes")}</SelectItem>
                {(Object.keys(TYPE_LABELS) as NotificationType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="me-2 h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BellOff className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">{t("notifications.noNotifications")}</p>
          <p className="text-sm">{t("notifications.noNotificationsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {dateLabel}
              </h3>
              <div className="space-y-2">
                {items.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type] || Info;
                  const colorClass = TYPE_COLORS[notification.type] || TYPE_COLORS.INFO;
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50 cursor-pointer ${
                        !notification.isRead ? "bg-blue-50/50 border-blue-200" : ""
                      }`}
                      onClick={() => {
                        if (!notification.isRead) handleMarkAsRead(notification.id);
                      }}
                    >
                      <div className={`rounded-full p-2 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[notification.type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
