import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";

export interface ChatMessageData {
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: string;
  type: "TEXT" | "SYSTEM";
}

export interface TypingStatus {
  senderId: string;
  senderName: string;
  typing: boolean;
}

export function useChat() {
  const { subscribe, sendMessage, connected } = useWebSocket();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingStatus>>(new Map());
  const typingTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!connected) return;

    // Subscribe to personal chat queue
    const unsubChat = subscribe(
      "/user/queue/chat",
      (msg: unknown) => {
        const chatMsg = msg as ChatMessageData;
        setMessages((prev) => [...prev, chatMsg]);
      }
    );

    // Subscribe to typing notifications
    const unsubTyping = subscribe(
      "/user/queue/chat.typing",
      (msg: unknown) => {
        const typingNotif = msg as TypingStatus;
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (typingNotif.typing) {
            next.set(typingNotif.senderId, typingNotif);
            // Auto-clear typing status after 3 seconds
            const existingTimeout = typingTimeoutRef.current.get(typingNotif.senderId);
            if (existingTimeout) clearTimeout(existingTimeout);
            const timeout = setTimeout(() => {
              setTypingUsers((p) => {
                const n = new Map(p);
                n.delete(typingNotif.senderId);
                return n;
              });
            }, 3000);
            typingTimeoutRef.current.set(typingNotif.senderId, timeout);
          } else {
            next.delete(typingNotif.senderId);
          }
          return next;
        });
      }
    );

    return () => {
      unsubChat();
      unsubTyping();
      // Clean up typing timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [connected, subscribe]);

  const sendChatMessage = useCallback(
    (recipientId: string, content: string) => {
      const userStr = localStorage.getItem("user");
      let senderId = 0;
      let senderName = "Moi";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          senderId = user.id || 0;
          senderName = user.name || user.email || "Moi";
        } catch {
          // ignore parse errors
        }
      }

      const message: ChatMessageData = {
        senderId,
        senderName,
        recipientId,
        content,
        timestamp: new Date().toISOString(),
        type: "TEXT",
      };

      sendMessage("/app/chat.send", message);
    },
    [sendMessage]
  );

  const setTyping = useCallback(
    (recipientId: string, typing: boolean) => {
      const userStr = localStorage.getItem("user");
      let senderId = 0;
      let senderName = "Moi";
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          senderId = user.id || 0;
          senderName = user.name || user.email || "Moi";
        } catch {
          // ignore parse errors
        }
      }

      sendMessage("/app/chat.typing", {
        senderId,
        senderName,
        recipientId,
        typing,
      });
    },
    [sendMessage]
  );

  const isTyping = useCallback(
    (userId: string): boolean => {
      return typingUsers.has(userId);
    },
    [typingUsers]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage: sendChatMessage,
    isTyping,
    setTyping,
    typingUsers: Array.from(typingUsers.values()),
    clearMessages,
    connected,
  };
}
