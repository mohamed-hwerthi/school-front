export interface MessageItem {
  id: string;
  senderId: string;
  senderName?: string;
  subject: string;
  body: string;
  type: 'MESSAGE' | 'CIRCULAIRE';
  createdAt: string;
  readAt?: string;
}

export interface SendMessageRequest {
  recipientIds: string[];
  subject: string;
  body: string;
  type: 'MESSAGE' | 'CIRCULAIRE';
}
