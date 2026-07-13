import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vitrineAdminApi } from "@/api/vitrine-admin.api";
import { notify } from "@/lib/toast";
import type { VitrineConfig, VitrinePage, VitrineSection, VitrineAnnouncement, VitrineGalleryItem, VitrineAnalytics, VitrineContact } from "@/types/vitrine";

const KEYS = {
  config: ["vitrine-admin", "config"] as const,
  pages: ["vitrine-admin", "pages"] as const,
  sections: (pageId: string) => ["vitrine-admin", "sections", pageId] as const,
  gallery: ["vitrine-admin", "gallery"] as const,
  announcements: ["vitrine-admin", "announcements"] as const,
  analytics: ["vitrine-admin", "analytics"] as const,
  contacts: ["vitrine-admin", "contacts"] as const,
  unreadCount: ["vitrine-admin", "contacts", "unread"] as const,
};

// ======================== ANALYTICS ========================

export function useVitrineAnalytics() {
  return useQuery({
    queryKey: KEYS.analytics,
    queryFn: vitrineAdminApi.getAnalytics,
    staleTime: 60 * 1000, // 1 min
  });
}

// ======================== UPLOAD ========================

export function useVitrineUpload() {
  return useMutation({
    mutationFn: (file: File) => vitrineAdminApi.uploadImage(file),
    onError: (e: Error) => notify.error(e.message),
  });
}

// ======================== CONFIG ========================

export function useVitrineConfig() {
  return useQuery({
    queryKey: KEYS.config,
    queryFn: vitrineAdminApi.getConfig,
  });
}

export function useUpdateVitrineConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<VitrineConfig>) => vitrineAdminApi.updateConfig(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.config });
      notify.success("Configuration vitrine mise à jour");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

// ======================== PAGES ========================

export function useVitrinePages() {
  return useQuery({
    queryKey: KEYS.pages,
    queryFn: vitrineAdminApi.getPages,
  });
}

export function useCreateVitrinePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<VitrinePage>) => vitrineAdminApi.createPage(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pages });
      notify.success("Page créée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useUpdateVitrinePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<VitrinePage> }) => vitrineAdminApi.updatePage(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pages });
      notify.success("Page mise à jour");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useDeleteVitrinePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vitrineAdminApi.deletePage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pages });
      notify.success("Page supprimée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

// ======================== SECTIONS ========================

export function useVitrineSections(pageId: string) {
  return useQuery({
    queryKey: KEYS.sections(pageId),
    queryFn: () => vitrineAdminApi.getSections(pageId),
    enabled: !!pageId,
  });
}

export function useCreateVitrineSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, dto }: { pageId: string; dto: Partial<VitrineSection> }) =>
      vitrineAdminApi.createSection(pageId, dto),
    onSuccess: (_, { pageId }) => {
      qc.invalidateQueries({ queryKey: KEYS.sections(pageId) });
      qc.invalidateQueries({ queryKey: KEYS.pages });
      notify.success("Section créée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useUpdateVitrineSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<VitrineSection> }) =>
      vitrineAdminApi.updateSection(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vitrine-admin"] });
      notify.success("Section mise à jour");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useDeleteVitrineSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vitrineAdminApi.deleteSection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vitrine-admin"] });
      notify.success("Section supprimée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

// ======================== GALLERY ========================

export function useVitrineGallery() {
  return useQuery({
    queryKey: KEYS.gallery,
    queryFn: vitrineAdminApi.getGallery,
  });
}

export function useAddVitrineGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<VitrineGalleryItem>) => vitrineAdminApi.addGalleryItem(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.gallery });
      notify.success("Image ajoutée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useDeleteVitrineGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vitrineAdminApi.deleteGalleryItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.gallery });
      notify.success("Image supprimée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

// ======================== ANNOUNCEMENTS ========================

export function useVitrineAnnouncements() {
  return useQuery({
    queryKey: KEYS.announcements,
    queryFn: vitrineAdminApi.getAnnouncements,
  });
}

export function useCreateVitrineAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<VitrineAnnouncement>) => vitrineAdminApi.createAnnouncement(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.announcements });
      notify.success("Annonce créée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useUpdateVitrineAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<VitrineAnnouncement> }) =>
      vitrineAdminApi.updateAnnouncement(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.announcements });
      notify.success("Annonce mise à jour");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useDeleteVitrineAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vitrineAdminApi.deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.announcements });
      notify.success("Annonce supprimée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

// ======================== CONTACTS ========================

export function useVitrineContacts() {
  return useQuery({
    queryKey: KEYS.contacts,
    queryFn: vitrineAdminApi.getContacts,
  });
}

export function useVitrineUnreadCount() {
  return useQuery({
    queryKey: KEYS.unreadCount,
    queryFn: vitrineAdminApi.getUnreadCount,
    refetchInterval: 30 * 1000, // poll every 30s
  });
}

export function useMarkContactAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vitrineAdminApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.contacts });
      qc.invalidateQueries({ queryKey: KEYS.unreadCount });
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useReplyToContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, replyText }: { id: string; replyText: string }) =>
      vitrineAdminApi.replyToContact(id, replyText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.contacts });
      qc.invalidateQueries({ queryKey: KEYS.unreadCount });
      notify.success("Réponse envoyée");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}
