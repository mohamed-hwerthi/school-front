/**
 * Helpers for the public school vitrine site, which is served either:
 *  - On a subdomain: `malika.localhost:5000` or `malika.example.com` (preferred)
 *  - On a path: `localhost:5000/vitrine/malika` (legacy / fallback)
 *
 * The subdomain mode requires no DNS changes in dev because modern browsers
 * resolve `*.localhost` to 127.0.0.1 automatically.
 */

const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "admin"]);

/**
 * Returns the school slug if the current hostname is `slug.something`,
 * otherwise null. Excludes reserved subdomains and bare IP/localhost hosts.
 */
export function getSubdomainSlug(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;

  const parts = host.split(".");
  if (parts.length < 2) return null;

  const candidate = parts[0];
  if (!candidate || RESERVED_SUBDOMAINS.has(candidate)) return null;
  return candidate;
}

export function isSubdomainMode(): boolean {
  return getSubdomainSlug() !== null;
}

/** URL of a vitrine page within the same vitrine (relative). */
export function vitrineHomeUrl(slug: string): string {
  return isSubdomainMode() ? "/" : `/vitrine/${slug}`;
}

export function vitrinePageUrl(slug: string, pageSlug: string): string {
  return isSubdomainMode() ? `/${pageSlug}` : `/vitrine/${slug}/${pageSlug}`;
}

/**
 * Returns the absolute URL to a school's vitrine on its own subdomain.
 * Used by the dashboard navbar to link out to the public site.
 */
export function buildVitrineUrl(
  slug: string,
  options: { preview?: boolean } = {}
): string {
  const { protocol, hostname, port } = window.location;

  // Strip the leading subdomain so we always anchor to the root domain.
  let root = hostname;
  if (hostname !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split(".");
    root = parts.length > 2 ? parts.slice(1).join(".") : hostname;
  }

  const portPart = port ? `:${port}` : "";
  const previewQs = options.preview ? "?preview=true" : "";
  return `${protocol}//${slug}.${root}${portPart}/${previewQs}`;
}
