import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VitrineConfig, VitrinePage } from "@/types/vitrine";
import { Button } from "@/components/ui/button";
import { resolveFileUrl } from "@/api/storage.api";
import { vitrineHomeUrl, isSubdomainMode } from "@/lib/vitrine-routing";

/** Maps a page slug to the matching anchor inside the single-page landing.
 *  Unknown slugs fall back to `#<slug>` so custom pages can target their own id. */
function pageSlugToAnchor(slug: string): string {
  const map: Record<string, string> = {
    accueil: "#top",
    "a-propos": "#about",
    contact: "#contact",
  };
  return map[slug] ?? `#${slug}`;
}

interface Props {
  config: VitrineConfig;
  pages: VitrinePage[];
  isPreview?: boolean;
}

export default function VitrineNavbar({ config, pages, isPreview = false }: Props) {
  const params = useParams<{ slug?: string; pageSlug?: string }>();
  const pageSlug = params.pageSlug;
  const location = useLocation();
  const navigate = useNavigate();
  const homePath = vitrineHomeUrl(params.slug ?? "");
  const isOnHome = isSubdomainMode()
    ? location.pathname === "/"
    : location.pathname === homePath;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileOpen(false);
    if (isOnHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(homePath);
    }
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    if (anchor === "#top") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const target = document.querySelector(anchor);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActivePage = (page: VitrinePage) => {
    if (pageSlug) {
      return page.slug === pageSlug;
    }
    // First page is active by default when no pageSlug
    return pages.indexOf(page) === 0;
  };

  return (
    <nav
      style={{ top: isPreview ? "2.5rem" : 0 }}
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/90"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Logo + Name */}
        <a
          href={homePath}
          onClick={handleLogoClick}
          className="group flex items-center gap-3"
        >
          {config.logoUrl && (
            <motion.img
              src={resolveFileUrl(config.logoUrl)}
              alt={config.schoolDisplayName}
              className="h-10 w-10 rounded-full object-cover lg:h-12 lg:w-12"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          )}
          <span
            className={`text-lg font-bold transition-colors duration-300 lg:text-xl ${
              scrolled ? "text-gray-900" : "text-white"
            }`}
          >
            {config.schoolDisplayName}
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {pages.map((page) => {
            const active = isActivePage(page);
            const anchor = pageSlugToAnchor(page.slug);
            return (
              <a
                key={page.id}
                href={anchor}
                onClick={(e) => handleAnchorClick(e, anchor)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                  scrolled
                    ? active
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                    : active
                      ? "text-white"
                      : "text-white/80 hover:text-white"
                }`}
              >
                {page.title}
                {/* Animated underline */}
                <motion.span
                  className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: scrolled ? config.primaryColor : "white" }}
                  initial={false}
                  animate={{ width: active ? "60%" : "0%" }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </a>
            );
          })}
          {config.contactPhone && (
            <Button
              asChild
              size="sm"
              className="ml-4 gap-2 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: config.primaryColor }}
            >
              <a href={`tel:${config.contactPhone}`}>
                <Phone className="h-4 w-4" />
                Nous appeler
              </a>
            </Button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className={`relative z-50 rounded-lg p-2 transition-colors md:hidden ${
            scrolled ? "text-gray-900 hover:bg-gray-100" : "text-white hover:bg-white/10"
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              className="fixed top-0 right-0 z-40 h-full w-80 max-w-[85vw] bg-white shadow-2xl md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b px-6 py-5">
                  {config.logoUrl && (
                    <img
                      src={resolveFileUrl(config.logoUrl)}
                      alt={config.schoolDisplayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <span className="text-lg font-bold text-gray-900">
                    {config.schoolDisplayName}
                  </span>
                </div>

                {/* Links */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-1">
                    {pages.map((page, index) => {
                      const active = isActivePage(page);
                      const anchor = pageSlugToAnchor(page.slug);
                      return (
                        <motion.div
                          key={page.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <a
                            href={anchor}
                            onClick={(e) => handleAnchorClick(e, anchor)}
                            className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                              active
                                ? "text-white"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                            style={
                              active
                                ? { backgroundColor: config.primaryColor }
                                : undefined
                            }
                          >
                            {page.title}
                          </a>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer action */}
                {config.contactPhone && (
                  <div className="border-t px-6 py-4">
                    <Button
                      asChild
                      className="w-full gap-2"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <a href={`tel:${config.contactPhone}`}>
                        <Phone className="h-4 w-4" />
                        {config.contactPhone}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
