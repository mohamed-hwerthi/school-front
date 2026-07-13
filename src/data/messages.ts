import type { Message } from "@/types/message";

export const MOCK_MESSAGES: Message[] = [
  // Conversation with student 1 (Amira Benali)
  { id: "1", studentId: "1", senderRole: "parent", content: "Bonjour, je voudrais savoir si Amira a bien reçu ses fournitures scolaires.", timestamp: "2026-02-18T09:15:00Z", read: true },
  { id: "2", studentId: "1", senderRole: "admin", content: "Bonjour M. Benali, oui toutes les fournitures ont été distribuées lundi dernier.", timestamp: "2026-02-18T10:30:00Z", read: true },
  { id: "3", studentId: "1", senderRole: "parent", content: "Parfait, merci beaucoup. Et concernant la sortie scolaire prévue en mars ?", timestamp: "2026-02-19T08:45:00Z", read: false },

  // Conversation with student 2 (Youssef El Fassi)
  { id: "4", studentId: "2", senderRole: "parent", content: "Bonjour, Youssef sera absent demain pour un rendez-vous médical.", timestamp: "2026-02-17T14:00:00Z", read: true },
  { id: "5", studentId: "2", senderRole: "admin", content: "Merci de nous prévenir. Prière de fournir un justificatif à son retour.", timestamp: "2026-02-17T14:30:00Z", read: true },
  { id: "6", studentId: "2", senderRole: "parent", content: "Bien sûr, je vous l'enverrai dès que possible.", timestamp: "2026-02-17T15:00:00Z", read: true },

  // Conversation with student 3 (Fatima Zahra Idrissi)
  { id: "7", studentId: "3", senderRole: "admin", content: "Bonjour, le dossier d'inscription de Fatima Zahra est incomplet. Il manque le certificat de naissance.", timestamp: "2026-02-16T11:00:00Z", read: true },
  { id: "8", studentId: "3", senderRole: "parent", content: "Bonjour, je m'en occupe cette semaine. Puis-je le déposer vendredi ?", timestamp: "2026-02-16T16:20:00Z", read: false },

  // Conversation with student 4 (Omar Chakir)
  { id: "9", studentId: "4", senderRole: "parent", content: "Bonsoir, Omar m'a dit qu'il avait un contrôle de maths la semaine prochaine. Pouvez-vous me confirmer la date ?", timestamp: "2026-02-19T18:30:00Z", read: false },

  // Conversation with student 5 (Salma Tazi)
  { id: "10", studentId: "5", senderRole: "admin", content: "Bonjour M. Tazi, nous souhaitions vous informer que Salma a beaucoup progressé en lecture ce trimestre.", timestamp: "2026-02-15T10:00:00Z", read: true },
  { id: "11", studentId: "5", senderRole: "parent", content: "Merci beaucoup, c'est une bonne nouvelle ! On continue les efforts à la maison aussi.", timestamp: "2026-02-15T12:15:00Z", read: true },
];
