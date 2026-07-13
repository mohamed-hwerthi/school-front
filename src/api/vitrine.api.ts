import axios from "axios";
import env from "@/config/env";
import type {
  VitrinePublicData,
  VitrinePage,
  VitrineAnnouncement,
  VitrineGalleryItem,
} from "@/types/vitrine";

/**
 * Public vitrine API — no auth required, no X-Tenant-ID header.
 * Tenant is resolved from the URL slug.
 */
const publicApi = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Unwrap ApiResponse wrapper
publicApi.interceptors.response.use((response) => {
  const body = response.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) {
      return Promise.reject(new Error(body.message || "Erreur serveur"));
    }
    response.data = body.data;
  }
  return response;
});

export const vitrinePublicApi = {
  getFullVitrine: async (slug: string, options: { preview?: boolean } = {}): Promise<VitrinePublicData> => {
    const res = await publicApi.get<VitrinePublicData>(`/public/vitrine/${slug}`, {
      params: options.preview ? { preview: "true" } : undefined,
    });
    return res.data;
  },

  getPages: async (slug: string): Promise<VitrinePage[]> => {
    const res = await publicApi.get<VitrinePage[]>(`/public/vitrine/${slug}/pages`);
    return res.data;
  },

  getPage: async (slug: string, pageSlug: string): Promise<VitrinePage> => {
    const res = await publicApi.get<VitrinePage>(`/public/vitrine/${slug}/pages/${pageSlug}`);
    return res.data;
  },

  getAnnouncements: async (slug: string): Promise<VitrineAnnouncement[]> => {
    const res = await publicApi.get<VitrineAnnouncement[]>(`/public/vitrine/${slug}/announcements`);
    return res.data;
  },

  getGallery: async (slug: string): Promise<VitrineGalleryItem[]> => {
    const res = await publicApi.get<VitrineGalleryItem[]>(`/public/vitrine/${slug}/gallery`);
    return res.data;
  },
};
