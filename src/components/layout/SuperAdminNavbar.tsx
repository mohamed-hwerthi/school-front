import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Maximize, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Topbar for the Super Admin space — a slimmed-down version of {@link Navbar}
 * without the school-flavoured bits (SMS badge, per-school public site link,
 * notifications). The platform operator only needs language, fullscreen and
 * his account menu.
 */
export function SuperAdminNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  const initials = user
    ? `${(user.firstName ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "??"
    : "??";
  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "Utilisateur"
    : "Utilisateur";
  const displayRole = user?.role?.replace("_", " ") ?? "";

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 backdrop-blur-xl bg-background/60 px-4">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-semibold text-foreground">Espace Super Admin</span>

      <div className="ms-auto flex items-center gap-1.5">
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 rounded-full hover:bg-muted/60 transition-all"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Maximize className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2.5 ps-1.5 pe-3 rounded-full hover:bg-muted/60 transition-all"
            >
              <div className="relative">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium leading-none">{displayName}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {displayRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="me-2 h-4 w-4" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
