import { useEffect, useCallback, useRef } from "react";

/**
 * Registers a global keyboard shortcut and fires a callback when triggered.
 *
 * Supports modifier combinations using `+` as separator:
 * - `"ctrl+k"` -- Ctrl+K (Cmd+K on macOS)
 * - `"ctrl+shift+n"` -- Ctrl+Shift+N
 * - `"escape"` -- Escape key (no modifier)
 *
 * The hook automatically prevents default browser behaviour for the
 * registered combination and cleans up on unmount.
 *
 * @param shortcut The key combination string (case-insensitive).
 * @param callback The function to execute when the shortcut is pressed.
 * @param enabled  Whether the shortcut is active (default `true`).
 *
 * @example
 * ```ts
 * useKeyboardShortcut("ctrl+k", () => setSearchOpen(true));
 * useKeyboardShortcut("ctrl+n", () => navigate("/eleves/ajouter"));
 * useKeyboardShortcut("escape", () => setDialogOpen(false), dialogOpen);
 * ```
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: () => void,
  enabled = true,
) {
  // Keep callback ref stable to avoid re-registering on every render
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
      const key = parts[parts.length - 1];
      const modifiers = parts.slice(0, -1);

      const needsCtrl = modifiers.includes("ctrl") || modifiers.includes("cmd") || modifiers.includes("meta");
      const needsShift = modifiers.includes("shift");
      const needsAlt = modifiers.includes("alt");

      const ctrlMatch = needsCtrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
      const shiftMatch = needsShift ? e.shiftKey : !e.shiftKey;
      const altMatch = needsAlt ? e.altKey : !e.altKey;

      if (ctrlMatch && shiftMatch && altMatch && e.key.toLowerCase() === key) {
        e.preventDefault();
        callbackRef.current();
      }
    },
    [shortcut, enabled],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
