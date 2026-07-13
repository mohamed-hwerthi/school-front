import { useCallback, useRef, useState } from "react";
import { Upload, X, FileIcon, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { uploadFile, type FileInfo } from "@/api/storage.api";

export interface FileUploadProps {
  /** Storage folder to upload files into (e.g. "students", "devoirs"). */
  folder: string;
  /** Comma-separated accepted file types (e.g. "image/*,.pdf"). */
  accept?: string;
  /** Max file size in bytes. Default: 10 MB. */
  maxSize?: number;
  /** Allow selecting multiple files. */
  multiple?: boolean;
  /** Called when a file is successfully uploaded. */
  onUpload?: (info: FileInfo) => void;
  /** Called when a file is removed from the selection. */
  onRemove?: (index: number) => void;
  /** Additional CSS classes for the root element. */
  className?: string;
  /** Whether the upload zone is disabled. */
  disabled?: boolean;
}

interface SelectedFile {
  file: File;
  preview?: string;
  uploading: boolean;
  progress: number;
  error?: string;
  uploaded?: FileInfo;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function FileUpload({
  folder,
  accept,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = false,
  onUpload,
  onRemove,
  className,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const updateEntry = useCallback(
    (file: File, patch: Partial<SelectedFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, ...patch } : f))
      );
    },
    []
  );

  const uploadEntry = useCallback(
    async (file: File) => {
      updateEntry(file, { uploading: true, progress: 10, error: undefined });
      try {
        updateEntry(file, { progress: 50 });
        const info = await uploadFile(file, folder);
        updateEntry(file, { uploading: false, progress: 100, uploaded: info });
        onUpload?.(info);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de l'upload";
        updateEntry(file, { uploading: false, progress: 0, error: message });
      }
    },
    [folder, onUpload, updateEntry]
  );

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      const selectedFiles: SelectedFile[] = fileArray.map((file) => {
        const entry: SelectedFile = {
          file,
          uploading: false,
          progress: 0,
        };

        if (file.size > maxSize) {
          entry.error = `Taille maximale: ${formatFileSize(maxSize)}`;
        }

        if (isImageFile(file) && !entry.error) {
          entry.preview = URL.createObjectURL(file);
        }

        return entry;
      });

      setFiles((prev) => (multiple ? [...prev, ...selectedFiles] : selectedFiles));

      selectedFiles.forEach((entry) => {
        if (!entry.error) void uploadEntry(entry.file);
      });
    },
    [maxSize, multiple, uploadEntry]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input so re-selecting the same file triggers change
      e.target.value = "";
    },
    [addFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const file = prev[index];
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return prev.filter((_, i) => i !== index);
      });
      onRemove?.(index);
    },
    [onRemove]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Cliquez pour parcourir
          </span>{" "}
          ou glissez-deposez vos fichiers ici
        </div>
        <div className="text-xs text-muted-foreground">
          Taille max: {formatFileSize(maxSize)}
          {accept && ` | Formats: ${accept}`}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((entry, index) => (
            <div
              key={`${entry.file.name}-${index}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                entry.error && "border-destructive/50 bg-destructive/5",
                entry.uploaded && "border-green-500/50 bg-green-50 dark:bg-green-950/20"
              )}
            >
              {/* Preview / Icon */}
              <div className="flex-shrink-0">
                {entry.preview ? (
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : isImageFile(entry.file) ? (
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <FileIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {entry.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(entry.file.size)}
                </p>
                {entry.error && (
                  <p className="text-xs text-destructive mt-0.5">
                    {entry.error}
                  </p>
                )}
                {entry.uploading && (
                  <Progress value={entry.progress} className="mt-1 h-1.5" />
                )}
                {entry.uploaded && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Upload terminé
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {entry.uploading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!entry.uploading && !entry.uploaded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
