import { useState, useRef } from "react";
import { Camera, Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notify } from "@/lib/toast";
import { uploadFile, getFileUrl } from "@/api/storage.api";

interface PhotoUploadProps {
  studentId?: string;
  studentName: string;
  currentPhotoUrl?: string | null;
  onPhotoUploaded?: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Get stored photo URL for a student from localStorage.
 * This serves as a lightweight client-side cache since the Student entity
 * does not have a photoUrl field yet.
 */
export function getStudentPhotoUrl(studentId: string): string | null {
  try {
    return localStorage.getItem(`student-photo-${studentId}`);
  } catch {
    return null;
  }
}

/**
 * Store a photo URL for a student in localStorage.
 */
function setStudentPhotoUrl(studentId: string, url: string) {
  try {
    localStorage.setItem(`student-photo-${studentId}`, url);
  } catch {
    // localStorage might be full or unavailable
  }
}

/**
 * Remove stored photo URL for a student.
 */
function removeStudentPhotoUrl(studentId: string) {
  try {
    localStorage.removeItem(`student-photo-${studentId}`);
  } catch {
    // ignore
  }
}

export function PhotoUpload({
  studentId,
  studentName,
  currentPhotoUrl,
  onPhotoUploaded,
  size = "md",
}: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    currentPhotoUrl || (studentId ? getStudentPhotoUrl(studentId) : null)
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      notify.error("Veuillez selectionner une image (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify.error("La taille de l'image ne doit pas depasser 5 Mo");
      return;
    }

    setUploading(true);
    try {
      const fileInfo = await uploadFile(file, "students");
      const fullUrl = getFileUrl(fileInfo.filePath);

      setPhotoUrl(fullUrl);
      if (studentId) {
        setStudentPhotoUrl(studentId, fullUrl);
      }
      onPhotoUploaded?.(fullUrl);
      notify.success("Photo mise a jour");
    } catch {
      notify.error("Erreur lors du telechargement de la photo");
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    if (studentId) {
      removeStudentPhotoUrl(studentId);
    }
    onPhotoUploaded?.("");
    notify.success("Photo supprimee");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          {photoUrl ? (
            <AvatarImage src={photoUrl} alt={studentName} />
          ) : null}
          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
            {initials || <User className={iconSizes[size]} />}
          </AvatarFallback>
        </Avatar>

        {/* Hover overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-4 w-4 text-white" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className={iconSizes[size]} />
            {uploading ? "Envoi..." : photoUrl ? "Changer" : "Ajouter photo"}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-red-600"
              onClick={handleRemovePhoto}
            >
              <X className="h-3.5 w-3.5" />
              Retirer
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG. Max 5 Mo.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
