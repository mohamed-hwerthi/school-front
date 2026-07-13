import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStudent } from "@/hooks/useStudents";
import { useMessages } from "@/hooks/useMessages";
import { StudentMessagesSkeleton } from "@/components/skeletons/StudentMessagesSkeleton";
import { useLanguage } from "@/hooks/useLanguage";

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

export default function StudentMessages() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = id;
  const { data: student, isLoading } = useStudent(studentId);
  const { sendMessage, getConversation, markAsRead } = useMessages();

  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const conversation = getConversation(studentId);

  // Mark messages as read on mount
  useEffect(() => {
    if (student) {
      markAsRead(studentId);
    }
  }, [student, studentId, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(studentId, trimmed, "admin");
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) return <StudentMessagesSkeleton />;

  if (!student) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 mb-6"
          onClick={() => navigate("/dashboard/eleves")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="font-heading text-lg font-bold text-foreground">{t("students.studentNotFound")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            L'élève demandé n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  const getInitials = () => `${student.prenom[0]}${student.nom[0]}`.toUpperCase();
  const getAvatarColor = () => avatarColors[student.id % avatarColors.length];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return time;
    const day = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    return `${day} ${time}`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Back button */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(`/dashboard/eleves/${student.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback className={`text-sm font-semibold ${getAvatarColor()}`}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground">
            {student.prenom} {student.nom}
          </h1>
          <p className="text-xs text-muted-foreground">
            Messagerie avec le parent
            {student.prenomParent && student.nomParent
              ? ` — ${student.prenomParent} ${student.nomParent}`
              : ""}
          </p>
        </div>
      </motion.div>

      {/* Chat area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="flex-1 rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col min-h-0"
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{t("chat.noMessages")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Envoyez le premier message au parent de cet élève.
              </p>
            </div>
          ) : (
            conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.senderRole === "admin"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.senderRole === "admin" ? "text-white/60" : "text-muted-foreground"
                    }`}
                  >
                    {msg.senderRole === "admin" ? t("chat.you") : t("common.parent")} · {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.typeMessage")}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim()}
          className="gap-1.5 bg-gradient-primary shadow-btn"
        >
          <Send className="h-4 w-4" />
          {t("chat.sendMessage")}
        </Button>
      </motion.div>
    </div>
  );
}
