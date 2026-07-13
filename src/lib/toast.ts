import { toast } from "sonner";

/**
 * Centralized toast notification helpers.
 *
 * Usage:
 *   import { notify } from "@/lib/toast";
 *   notify.success("Saved!", "Student record updated");
 *   notify.error("Something went wrong");
 *   notify.promise(apiCall(), { loading: "Saving...", success: "Done!", error: "Failed" });
 *   notify.delete("Student deleted", () => undoDelete(id));
 */

export const notify = {
  /** Green success toast — use after create/update/save operations */
  success(message: string, description?: string) {
    return toast.success(message, { description });
  },

  /** Red error toast — use for API errors, validation failures */
  error(message: string, description?: string) {
    return toast.error(message, { description, duration: 6000 });
  },

  /** Amber warning toast — use for non-blocking issues */
  warning(message: string, description?: string) {
    return toast.warning(message, { description, duration: 5000 });
  },

  /** Blue info toast — use for neutral information */
  info(message: string, description?: string) {
    return toast.info(message, { description });
  },

  /** Loading toast — returns an id to dismiss or update later */
  loading(message: string) {
    return toast.loading(message);
  },

  /** Dismiss a specific toast or all toasts */
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },

  /**
   * Promise toast — shows loading → success/error automatically.
   *
   * Example:
   *   notify.promise(createStudent(data), {
   *     loading: "Inscription en cours...",
   *     success: "Eleve inscrit avec succes",
   *     error: "Erreur lors de l'inscription",
   *   });
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) {
    return toast.promise(promise, messages);
  },

  /**
   * Delete toast with undo action.
   *
   * Example:
   *   notify.delete("Eleve supprime", () => restoreStudent(id));
   */
  delete(message: string, onUndo?: () => void) {
    return toast.success(message, {
      description: onUndo ? "Cliquez pour annuler" : undefined,
      duration: onUndo ? 6000 : 4000,
      action: onUndo
        ? { label: "Annuler", onClick: onUndo }
        : undefined,
    });
  },

  /**
   * Mutation helper — wraps a React Query mutation callback pattern.
   *
   * Example:
   *   createStudent.mutate(data, notify.mutation({
   *     success: "Eleve inscrit avec succes",
   *     error: "Erreur lors de l'inscription",
   *     onSuccess: () => navigate("/dashboard/eleves"),
   *   }));
   */
  mutation<TData = unknown, TError = Error>(opts: {
    success: string;
    error?: string;
    successDescription?: string;
    onSuccess?: (data: TData) => void;
    onError?: (err: TError) => void;
  }) {
    return {
      onSuccess: (data: TData) => {
        toast.success(opts.success, {
          description: opts.successDescription,
        });
        opts.onSuccess?.(data);
      },
      onError: (err: TError) => {
        const backendMessage = err instanceof Error ? err.message : null;
        const fallback = opts.error || "Une erreur est survenue";
        const primary = backendMessage && backendMessage !== "Network Error"
          ? backendMessage
          : fallback;
        const description = backendMessage && primary !== fallback ? fallback : undefined;
        toast.error(primary, { duration: 6000, description });
        opts.onError?.(err);
      },
    };
  },
};
