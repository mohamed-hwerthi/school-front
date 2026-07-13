import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useVitrine } from "@/hooks/useVitrine";
import { getSubdomainSlug } from "@/lib/vitrine-routing";
import VitrineNavbar from "@/components/vitrine/VitrineNavbar";
import VitrineFooter from "@/components/vitrine/VitrineFooter";
import VitrineSectionRenderer from "@/components/vitrine/VitrineSectionRenderer";
import VitrineModernLanding from "@/components/vitrine/VitrineModernLanding";
import VitrineContactForm from "@/components/vitrine/VitrineContactForm";
import VitrineSEO from "@/components/vitrine/VitrineSEO";
import VitrinePreviewBanner from "@/components/vitrine/VitrinePreviewBanner";
import VitrineWhatsAppButton from "@/components/vitrine/VitrineWhatsAppButton";
import VitrineSkeleton from "@/components/vitrine/VitrineSkeleton";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Public vitrine page — renders the school's showcase website.
 * URL: /vitrine/:slug or /vitrine/:slug/:pageSlug
 */
export default function VitrineSite() {
  const { t } = useLanguage();
  const params = useParams<{ slug?: string; pageSlug?: string }>();
  const subdomainSlug = getSubdomainSlug();
  const slug = subdomainSlug ?? params.slug;
  const pageSlug = params.pageSlug;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get("preview") === "true";
  const { data, isLoading, isError } = useVitrine(slug, isPreview);

  if (isLoading) {
    return <VitrineSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t("showcase.siteNotFound")}</h1>
        <p className="text-gray-500">{t("showcase.siteNotFoundDesc")}</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Retour a l'accueil
        </button>
      </div>
    );
  }

  const { config, pages, announcements, gallery } = data;

  // Find active page — default to first page if no pageSlug
  const activePage = pageSlug
    ? pages.find((p) => p.slug === pageSlug)
    : pages[0];

  if (!activePage) {
    return (
      <div className="flex min-h-screen flex-col">
        <VitrineSEO config={config} slug={slug!} />
        <VitrineNavbar config={config} pages={pages} isPreview={isPreview} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{t("showcase.pageNotFound")}</h1>
            <p className="mt-2 text-gray-500">{t("showcase.pageNotFoundDesc")}</p>
          </div>
        </div>
        <VitrineFooter config={config} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* SEO meta tags */}
      <VitrineSEO config={config} pageTitle={activePage.title} slug={slug!} />

      {/* Preview mode banner */}
      {isPreview && <VitrinePreviewBanner />}

      <VitrineNavbar config={config} pages={pages} isPreview={isPreview} />

      <main className={`flex-1 ${isPreview ? "mt-10" : ""}`}>
        {!pageSlug ? (
          <VitrineModernLanding
            config={config}
            announcements={announcements}
            gallery={gallery}
            slug={slug ?? ""}
          />
        ) : (
          <>
            {activePage.sections.map((section) => (
              <VitrineSectionRenderer
                key={section.id}
                section={section}
                config={config}
                announcements={announcements}
                gallery={gallery}
              />
            ))}
            {pageSlug === "contact" &&
              !activePage.sections.some((s) => s.sectionType === "contact" as string) && (
                <VitrineContactForm config={config} slug={slug ?? ""} />
              )}
          </>
        )}
      </main>

      <VitrineFooter config={config} />

      {/* Floating WhatsApp button */}
      <VitrineWhatsAppButton config={config} />
    </div>
  );
}
