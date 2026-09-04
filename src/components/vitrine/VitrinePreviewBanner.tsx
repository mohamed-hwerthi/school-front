import { Eye, X } from "lucide-react";

interface Props {
  onDismiss: () => void;
}

export default function VitrinePreviewBanner({ onDismiss }: Props) {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <Eye className="h-4 w-4 shrink-0" />
      <span>Mode prévisualisation — ce site n'est pas encore publié</span>
      <button
        onClick={onDismiss}
        aria-label="Fermer"
        className="ml-2 rounded p-0.5 hover:bg-amber-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
