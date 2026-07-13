import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send, X, Minimize2, Users, Circle } from "lucide-react";
import { useChat, ChatMessageData } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  role?: string;
  online?: boolean;
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatWidget() {
  const { messages, sendMessage, isTyping, setTyping, connected } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [contacts] = useState<Contact[]>([
    // Placeholder contacts - in production these come from the API
    { id: 1, name: "Administration", role: "ADMIN", online: true },
    { id: 2, name: "Support Technique", role: "ADMIN", online: true },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when selecting a contact
  useEffect(() => {
    if (selectedContact && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedContact]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !selectedContact) return;
    sendMessage(selectedContact.id, inputValue.trim());
    setInputValue("");
    // Clear typing status
    setTyping(selectedContact.id, false);
  }, [inputValue, selectedContact, sendMessage, setTyping]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (!selectedContact) return;

      // Send typing indicator
      setTyping(selectedContact.id, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedContact) {
          setTyping(selectedContact.id, false);
        }
      }, 2000);
    },
    [selectedContact, setTyping]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get current user ID
  const getCurrentUserId = (): number => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 0;
      }
    } catch {
      // ignore
    }
    return 0;
  };

  const currentUserId = getCurrentUserId();

  // Filter messages for selected contact
  const contactMessages = selectedContact
    ? messages.filter(
        (m: ChatMessageData) =>
          (m.senderId === selectedContact.id && m.recipientId === currentUserId) ||
          (m.senderId === currentUserId && m.recipientId === selectedContact.id)
      )
    : [];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-105"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="h-6 w-6" />
        {!connected && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-72">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Chat</span>
            {!connected && (
              <Circle className="h-2 w-2 fill-red-500 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[28rem] bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-xl">
        <div className="flex items-center gap-2">
          {selectedContact ? (
            <button
              onClick={() => setSelectedContact(null)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <Users className="h-4 w-4" />
            </button>
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {selectedContact ? selectedContact.name : "Chat"}
          </span>
          {connected ? (
            <Circle className="h-2 w-2 fill-green-400 text-green-400" />
          ) : (
            <Circle className="h-2 w-2 fill-red-400 text-red-400" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setSelectedContact(null);
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!selectedContact ? (
        /* Contact List */
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Contacts
            </p>
          </div>
          {contacts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Aucun contact disponible
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      {contact.name.charAt(0)}
                    </div>
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {contact.name}
                    </p>
                    {contact.role && (
                      <p className="text-xs text-gray-500">{contact.role}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Message Thread */
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {contactMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Envoyez le premier message
              </div>
            ) : (
              contactMessages.map((msg: ChatMessageData, index: number) => {
                const isSelf = msg.senderId === currentUserId;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      isSelf ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2",
                        isSelf
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isSelf ? "text-white/70" : "text-gray-400"
                        )}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {selectedContact && isTyping(selectedContact.id) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tapez un message..."
                className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
