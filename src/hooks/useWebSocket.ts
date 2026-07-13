import { useEffect, useRef, useCallback, useState } from "react";
import env from "@/config/env";

/**
 * Minimal STOMP-over-WebSocket client implementation.
 * Works without external dependencies (no sockjs-client or @stomp/stompjs needed).
 *
 * NOTE: For production, install @stomp/stompjs and sockjs-client for better
 * browser compatibility and reconnection handling:
 *   npm install @stomp/stompjs sockjs-client
 *   npm install -D @types/sockjs-client
 */

interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

interface Subscription {
  id: string;
  destination: string;
  callback: (message: StompFrame) => void;
}

function encodeFrame(command: string, headers: Record<string, string>, body: string): string {
  let frame = command + "\n";
  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }
  frame += "\n" + body + "\0";
  return frame;
}

function decodeFrame(data: string): StompFrame {
  const lines = data.split("\n");
  const command = lines[0];
  const headers: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i] === "") break;
    const colonIndex = lines[i].indexOf(":");
    if (colonIndex > 0) {
      headers[lines[i].substring(0, colonIndex)] = lines[i].substring(colonIndex + 1);
    }
  }
  const body = lines.slice(i + 1).join("\n").replace(/\0$/, "");
  return { command, headers, body };
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const subCounterRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);

  const getWsUrl = useCallback(() => {
    const apiUrl = env.API_URL || "http://localhost:8083/api";
    // Derive WS base URL from API URL
    const baseUrl = apiUrl.replace(/\/api\/?$/, "");
    const wsBase = baseUrl.replace(/^http/, "ws");
    return `${wsBase}/ws/websocket`;
  }, []);

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        // Send STOMP CONNECT frame with auth token
        const connectFrame = encodeFrame("CONNECT", {
          "accept-version": "1.2",
          "heart-beat": "10000,10000",
          Authorization: `Bearer ${token}`,
        }, "");
        ws.send(connectFrame);
      };

      ws.onmessage = (event) => {
        const data = typeof event.data === "string" ? event.data : "";
        if (!data || data === "\n") return; // heartbeat

        const frame = decodeFrame(data);

        if (frame.command === "CONNECTED") {
          setConnected(true);
          // Re-subscribe all existing subscriptions
          subscriptionsRef.current.forEach((sub) => {
            const subFrame = encodeFrame("SUBSCRIBE", {
              id: sub.id,
              destination: sub.destination,
            }, "");
            ws.send(subFrame);
          });
        } else if (frame.command === "MESSAGE") {
          const subId = frame.headers.subscription;
          const sub = subscriptionsRef.current.get(subId);
          if (sub) {
            sub.callback(frame);
          }
        } else if (frame.command === "ERROR") {
          console.error("STOMP Error:", frame.body);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 5 seconds
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [getWsUrl]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const disconnectFrame = encodeFrame("DISCONNECT", {}, "");
      wsRef.current.send(disconnectFrame);
      wsRef.current.close();
    }
    wsRef.current = null;
    setConnected(false);
  }, []);

  const subscribe = useCallback(
    (destination: string, callback: (body: unknown) => void): (() => void) => {
      const subId = `sub-${subCounterRef.current++}`;
      const subscription: Subscription = {
        id: subId,
        destination,
        callback: (frame: StompFrame) => {
          try {
            const parsed = JSON.parse(frame.body);
            callback(parsed);
          } catch {
            callback(frame.body);
          }
        },
      };

      subscriptionsRef.current.set(subId, subscription);

      // If already connected, send SUBSCRIBE frame immediately
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && connected) {
        const subFrame = encodeFrame("SUBSCRIBE", {
          id: subId,
          destination,
        }, "");
        wsRef.current.send(subFrame);
      }

      // Return unsubscribe function
      return () => {
        subscriptionsRef.current.delete(subId);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const unsubFrame = encodeFrame("UNSUBSCRIBE", { id: subId }, "");
          wsRef.current.send(unsubFrame);
        }
      };
    },
    [connected]
  );

  const sendMessage = useCallback(
    (destination: string, body: unknown) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const sendFrame = encodeFrame(
          "SEND",
          { destination },
          typeof body === "string" ? body : JSON.stringify(body)
        );
        wsRef.current.send(sendFrame);
      } else {
        console.warn("WebSocket not connected. Cannot send message.");
      }
    },
    []
  );

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    subscribe,
    sendMessage,
    connect,
    disconnect,
  };
}
