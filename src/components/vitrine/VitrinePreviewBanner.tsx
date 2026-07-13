import { Eye, X } from "lucide-react";
import { useState } from "react";

export default function VitrinePreviewBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <Eye className="h-4 w-4" />
      <span>Mode pr&eacute;visualisation &mdash; ce site n'est pas encore publi&eacute;</span>
      <button onClick={() => setDismissed(true)} className="ml-2 rounded p-0.5 hover:bg-amber-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
