export type Message = {
  id: string;
  studentId: string;
  senderRole: "admin" | "parent";
  content: string;
  timestamp: string;
  read: boolean;
};

export type Conversation = {
  studentId: string;
  messages: Message[];
  unreadCount: number;
};
