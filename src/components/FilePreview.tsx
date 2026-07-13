import { useState } from "react";
import {
  FileIcon,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Film,
  Music,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFileUrl } from "@/api/storage.api";

export interface FilePreviewProps {
  /** Relative file path within storage. */
  filePath: string;
  /** Original file name to display. */
  fileName?: string;
  /** File size in bytes. */
  size?: number;
  /** MIME content type. */
  contentType?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Whether to show the download button. */
  showDownload?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileExtension(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.substring(dot + 1).toLowerCase() : "";
}

function isImage(path: string, contentType?: string): boolean {
  if (contentType?.startsWith("image/")) return true;
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
    getFileExtension(path)
  );
}

function isPdf(path: string, contentType?: string): boolean {
  if (contentType === "application/pdf") return true;
  return getFileExtension(path) === "pdf";
}

function isVideo(path: string, contentType?: string): boolean {
  if (contentType?.startsWith("video/")) return true;
  return ["mp4", "webm", "ogg"].includes(getFileExtension(path));
}

function isAudio(path: string, contentType?: string): boolean {
  if (contentType?.startsWith("audio/")) return true;
  return ["mp3", "wav", "ogg", "aac"].includes(getFileExtension(path));
}

function isSpreadsheet(path: string): boolean {
  return ["xls", "xlsx", "csv"].includes(getFileExtension(path));
}

function isDocument(path: string): boolean {
  return ["doc", "docx", "txt", "rtf"].includes(getFileExtension(path));
}

function getFileIcon(path: string, contentType?: string) {
  if (isImage(path, contentType))
    return <ImageIcon className="h-8 w-8 text-blue-500" />;
  if (isPdf(path, contentType))
    return <FileText className="h-8 w-8 text-red-500" />;
  if (isVideo(path, contentType))
    return <Film className="h-8 w-8 text-purple-500" />;
  if (isAudio(path, contentType))
    return <Music className="h-8 w-8 text-green-500" />;
  if (isSpreadsheet(path))
    return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
  if (isDocument(path))
    return <FileText className="h-8 w-8 text-blue-600" />;
  return <FileIcon className="h-8 w-8 text-muted-foreground" />;
}

export function FilePreview({
  filePath,
  fileName,
  size,
  contentType,
  className,
  showDownload = true,
}: FilePreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const url = getFileUrl(filePath);
  const displayName =
    fileName || filePath.substring(filePath.lastIndexOf("/") + 1);

  // Render image with lightbox
  if (isImage(filePath, contentType)) {
    return (
      <>
        <div
          className={cn(
            "group relative inline-flex flex-col items-center gap-1",
            className
          )}
        >
          <div
            className="relative cursor-pointer overflow-hidden rounded-lg border"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={url}
              alt={displayName}
              className="h-20 w-20 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            {displayName}
          </span>
          {size != null && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(size)}
            </span>
          )}
          {showDownload && (
            <a href={url} download={displayName} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Download className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setLightboxOpen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={url}
              alt={displayName}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // Render non-image file
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        className
      )}
    >
      {getFileIcon(filePath, contentType)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        {size != null && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(size)}
          </p>
        )}
      </div>
      {showDownload && (
        <a href={url} download={displayName}>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-3 w-3" />
            Télécharger
          </Button>
        </a>
      )}
    </div>
  );
}
