import { useEffect } from "react";
import type { VitrineConfig } from "@/types/vitrine";
import { resolveFileUrl } from "@/api/storage.api";

interface Props {
  config: VitrineConfig;
  pageTitle?: string;
  slug: string;
}

/**
 * Sets document title and meta tags for SEO.
 * Uses direct DOM manipulation (no react-helmet dependency needed).
 */
export default function VitrineSEO({ config, pageTitle, slug }: Props) {
  useEffect(() => {
    const title = pageTitle
      ? `${pageTitle} | ${config.schoolDisplayName}`
      : config.schoolDisplayName;
    document.title = title;

    setMeta("description", config.metaDescription || config.slogan || "");
    setMeta("og:title", title);
    setMeta("og:description", config.metaDescription || config.slogan || "");
    setMeta("og:type", "website");
    if (config.logoUrl) {
      setMeta("og:image", resolveFileUrl(config.logoUrl));
    }
    setMeta("og:url", window.location.href);
    setMeta("theme-color", config.primaryColor);

    return () => {
      document.title = "School System";
    };
  }, [config, pageTitle, slug]);

  return null;
}

function setMeta(name: string, content: string) {
  const isOg = name.startsWith("og:");
  const selector = isOg
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;

  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    if (isOg) {
      el.setAttribute("property", name);
    } else {
      el.setAttribute("name", name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
