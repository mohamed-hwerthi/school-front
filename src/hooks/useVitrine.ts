import { useQuery } from "@tanstack/react-query";
import { vitrinePublicApi } from "@/api/vitrine.api";

/**
 * Hook for public vitrine data (no auth).
 * A single cache key is used for both preview and public modes so that
 * dropping the ?preview URL param (after publication) does not reload the
 * page. In preview mode the query refetches on window focus and polls
 * lightly, so an open preview tab automatically notices the publication,
 * removes ?preview from the URL and hides the preview banner.
 */
export function useVitrine(slug: string | undefined, preview = false) {
  return useQuery({
    queryKey: ["vitrine", slug],
    queryFn: () => vitrinePublicApi.getFullVitrine(slug!, { preview: true }),
    enabled: !!slug,
    staleTime: preview ? 0 : 10 * 60 * 1000,
    refetchOnWindowFocus: preview ? true : undefined,
    refetchInterval: preview ? 15_000 : undefined,
  });
}

/**
 * School niveaux for the public pre-inscription form.
 * Read from the full vitrine response (GET /public/vitrine/{slug}?preview=true)
 * so the levels always come back together with the rest of the site data.
 * Preview mode is used so unpublished (draft) schools also expose their levels.
 */
export function useVitrineNiveaux(slug: string | undefined) {
  const { data, isLoading, isError } = useVitrine(slug, true);
  const niveaux =
    data?.niveaux?.map((n) => ({ id: n.id, nom: n.name, sections: n.sections })) ??
    [];
  return { niveaux, isLoading, isError };
}

export function useVitrinePage(slug: string | undefined, pageSlug: string | undefined) {
  return useQuery({
    queryKey: ["vitrine", slug, "page", pageSlug],
    queryFn: () => vitrinePublicApi.getPage(slug!, pageSlug!),
    enabled: !!slug && !!pageSlug,
    staleTime: 10 * 60 * 1000,
  });
}
