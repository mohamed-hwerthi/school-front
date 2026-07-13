import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadFile,
  uploadFiles,
  deleteFile,
  type FileInfo,
} from "@/api/storage.api";

const STORAGE_KEY = "storage";

/**
 * Upload a single file mutation.
 */
export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation<FileInfo, Error, { file: File; folder: string }>({
    mutationFn: ({ file, folder }) => uploadFile(file, folder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORAGE_KEY] });
    },
  });
}

/**
 * Upload multiple files mutation.
 */
export function useUploadFiles() {
  const qc = useQueryClient();
  return useMutation<FileInfo[], Error, { files: File[]; folder: string }>({
    mutationFn: ({ files, folder }) => uploadFiles(files, folder),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORAGE_KEY] });
    },
  });
}

/**
 * Delete a file mutation.
 */
export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (filePath: string) => deleteFile(filePath),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORAGE_KEY] });
    },
  });
}
