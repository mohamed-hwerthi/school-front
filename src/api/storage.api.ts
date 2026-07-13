import api from "./axios";
import env from "@/config/env";

export interface FileInfo {
  fileName: string;
  originalName: string;
  filePath: string;
  fileUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

/**
 * Upload a single file to the given folder.
 */
export async function uploadFile(
  file: File,
  folder: string
): Promise<FileInfo> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<FileInfo>(
    `/files/upload?folder=${encodeURIComponent(folder)}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
}

/**
 * Upload multiple files to the given folder.
 */
export async function uploadFiles(
  files: File[],
  folder: string
): Promise<FileInfo[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await api.post<FileInfo[]>(
    `/files/upload-multiple?folder=${encodeURIComponent(folder)}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
}

/**
 * Delete a file by its relative path.
 */
export async function deleteFile(filePath: string): Promise<void> {
  await api.delete(`/files?path=${encodeURIComponent(filePath)}`);
}

/**
 * Get file metadata by its relative path.
 */
export async function getFileInfo(filePath: string): Promise<FileInfo> {
  const res = await api.get<FileInfo>(
    `/files/info?path=${encodeURIComponent(filePath)}`
  );
  return res.data;
}

/**
 * Returns the full URL to access/download a file.
 */
export function getFileUrl(filePath: string): string {
  return `${env.API_URL}/files/${filePath}`;
}

/**
 * Convert a relative file URL (e.g. "/api/files/devoirs/x.pdf") returned by
 * the backend into an absolute URL pointing at the API host. Absolute URLs
 * are returned unchanged.
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  // env.API_URL is like "http://host:port/api" — strip the trailing "/api"
  // so we can prepend it to a "/api/..." relative path without duplicating.
  const host = env.API_URL.replace(/\/api\/?$/, "");
  return url.startsWith("/") ? `${host}${url}` : `${host}/${url}`;
}

/**
 * Storage filenames are stored as "{uuid}_{originalName}". This helper
 * extracts the original name for display, accepting either a full URL,
 * a path, or a bare filename.
 */
export function extractOriginalName(urlOrPath: string | null | undefined): string {
  if (!urlOrPath) return "";
  const last = urlOrPath.split("/").pop() ?? "";
  // UUID v4: 8-4-4-4-12 hex chars separated by dashes, followed by "_"
  const match = last.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_(.+)$/i);
  return match ? match[1] : last;
}
