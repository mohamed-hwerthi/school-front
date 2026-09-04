import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

/** Evenement Chromium, absent des types DOM standards. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install_banner_dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS expose son propre indicateur, hors standard.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Invite le parent a installer le portail sur son ecran d'accueil.
 *
 * Chrome/Android : on capte `beforeinstallprompt` et on ouvre la vraie boite
 * de dialogue d'installation. iOS ne propose aucune API : Safari n'installe
 * que via « Partager > Sur l'ecran d'accueil », donc on se contente d'y
 * renvoyer par une consigne.
 */
export function InstallAppBanner() {
  const { t } = useLanguage();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "1") return;

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    const onPrompt = (e: Event) => {
      // Empeche la mini-infobar de Chrome pour piloter le moment nous-memes.
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setPromptEvent(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    // L'evenement n'est utilisable qu'une fois.
    setPromptEvent(null);
  };

  if (!promptEvent && !showIosHint) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {showIosHint ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("parentPortal.install.title")}</p>
        {showIosHint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("parentPortal.install.iosHint")}
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("parentPortal.install.description")}
            </p>
            <Button size="sm" className="mt-2 h-8" onClick={install}>
              {t("parentPortal.install.action")}
            </Button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("parentPortal.install.dismiss")}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
