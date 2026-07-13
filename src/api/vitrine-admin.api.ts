import api from "./axios";
import type {
  VitrineConfig,
  VitrinePage,
  VitrineSection,
  VitrineGalleryItem,
  VitrineAnnouncement,
  VitrineAnalytics,
  VitrineContact,
} from "@/types/vitrine";

const BASE = "/vitrine";

export const vitrineAdminApi = {
  // Analytics
  getAnalytics: async (): Promise<VitrineAnalytics> => {
    const res = await api.get<VitrineAnalytics>(`${BASE}/analytics`);
    return res.data;
  },

  // Upload
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string }>(`${BASE}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  },

  // Config
  getConfig: async (): Promise<VitrineConfig> => {
    const res = await api.get<VitrineConfig>(`${BASE}/config`);
    return res.data;
  },
  updateConfig: async (dto: Partial<VitrineConfig>): Promise<VitrineConfig> => {
    const res = await api.put<VitrineConfig>(`${BASE}/config`, dto);
    return res.data;
  },

  // Pages
  getPages: async (): Promise<VitrinePage[]> => {
    const res = await api.get<VitrinePage[]>(`${BASE}/pages`);
    return res.data;
  },
  createPage: async (dto: Partial<VitrinePage>): Promise<VitrinePage> => {
    const res = await api.post<VitrinePage>(`${BASE}/pages`, dto);
    return res.data;
  },
  updatePage: async (id: string, dto: Partial<VitrinePage>): Promise<VitrinePage> => {
    const res = await api.put<VitrinePage>(`${BASE}/pages/${id}`, dto);
    return res.data;
  },
  deletePage: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/pages/${id}`);
  },

  // Sections
  getSections: async (pageId: string): Promise<VitrineSection[]> => {
    const res = await api.get<VitrineSection[]>(`${BASE}/pages/${pageId}/sections`);
    return res.data;
  },
  createSection: async (pageId: string, dto: Partial<VitrineSection>): Promise<VitrineSection> => {
    const res = await api.post<VitrineSection>(`${BASE}/pages/${pageId}/sections`, dto);
    return res.data;
  },
  updateSection: async (id: string, dto: Partial<VitrineSection>): Promise<VitrineSection> => {
    const res = await api.put<VitrineSection>(`${BASE}/sections/${id}`, dto);
    return res.data;
  },
  deleteSection: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/sections/${id}`);
  },

  // Gallery
  getGallery: async (): Promise<VitrineGalleryItem[]> => {
    const res = await api.get<VitrineGalleryItem[]>(`${BASE}/gallery`);
    return res.data;
  },
  addGalleryItem: async (dto: Partial<VitrineGalleryItem>): Promise<VitrineGalleryItem> => {
    const res = await api.post<VitrineGalleryItem>(`${BASE}/gallery`, dto);
    return res.data;
  },
  deleteGalleryItem: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/gallery/${id}`);
  },

  // Announcements
  getAnnouncements: async (): Promise<VitrineAnnouncement[]> => {
    const res = await api.get<VitrineAnnouncement[]>(`${BASE}/announcements`);
    return res.data;
  },
  createAnnouncement: async (dto: Partial<VitrineAnnouncement>): Promise<VitrineAnnouncement> => {
    const res = await api.post<VitrineAnnouncement>(`${BASE}/announcements`, dto);
    return res.data;
  },
  updateAnnouncement: async (id: string, dto: Partial<VitrineAnnouncement>): Promise<VitrineAnnouncement> => {
    const res = await api.put<VitrineAnnouncement>(`${BASE}/announcements/${id}`, dto);
    return res.data;
  },
  deleteAnnouncement: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/announcements/${id}`);
  },

  // Contacts
  getContacts: async (): Promise<VitrineContact[]> => {
    const res = await api.get<VitrineContact[]>(`${BASE}/contacts`);
    return res.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<number>(`${BASE}/contacts/unread-count`);
    return res.data;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.put(`${BASE}/contacts/${id}/read`);
  },
  replyToContact: async (id: string, replyText: string): Promise<void> => {
    await api.post(`${BASE}/contacts/${id}/reply`, { replyText });
  },
};
