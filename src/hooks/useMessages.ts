import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import React from "react";
import type { Message, Conversation } from "@/types/message";
import { MOCK_MESSAGES } from "@/data/messages";

interface MessagesContextValue {
  messages: Message[];
  sendMessage: (studentId: string, content: string, senderRole: "admin" | "parent") => void;
  getConversation: (studentId: string) => Conversation;
  markAsRead: (studentId: string) => void;
  getTotalUnreadCount: () => number;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  const sendMessage = useCallback(
    (studentId: string, content: string, senderRole: "admin" | "parent") => {
      setMessages((prev) => {
        const id = prev.length > 0 ? Math.max(...prev.map((m) => m.id)) + 1 : 1;
        const newMessage: Message = {
          id,
          studentId,
          senderRole,
          content,
          timestamp: new Date().toISOString(),
          read: senderRole === "admin",
        };
        return [...prev, newMessage];
      });
    },
    []
  );

  const getConversation = useCallback(
    (studentId: string): Conversation => {
      const studentMessages = messages
        .filter((m) => m.studentId === studentId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const unreadCount = studentMessages.filter(
        (m) => m.senderRole === "parent" && !m.read
      ).length;
      return { studentId, messages: studentMessages, unreadCount };
    },
    [messages]
  );

  const markAsRead = useCallback((studentId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.studentId === studentId && m.senderRole === "parent" && !m.read
          ? { ...m, read: true }
          : m
      )
    );
  }, []);

  const getTotalUnreadCount = useCallback(() => {
    return messages.filter((m) => m.senderRole === "parent" && !m.read).length;
  }, [messages]);

  const value: MessagesContextValue = {
    messages,
    sendMessage,
    getConversation,
    markAsRead,
    getTotalUnreadCount,
  };

  return React.createElement(MessagesContext.Provider, { value }, children);
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return ctx;
}
