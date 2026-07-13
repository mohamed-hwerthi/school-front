import { useParams } from "react-router-dom";
import type { VitrineSection, VitrineConfig, VitrineAnnouncement, VitrineGalleryItem } from "@/types/vitrine";
import VitrineHero from "./VitrineHero";
import VitrineTextBlock from "./VitrineTextBlock";
import VitrineStats from "./VitrineStats";
import VitrineCTA from "./VitrineCTA";
import VitrineGallery from "./VitrineGallery";
import VitrineAnnouncements from "./VitrineAnnouncements";
import VitrineMap from "./VitrineMap";
import VitrinePreInscription from "./VitrinePreInscription";
import VitrineContactForm from "./VitrineContactForm";

interface Props {
  section: VitrineSection;
  config: VitrineConfig;
  announcements?: VitrineAnnouncement[];
  gallery?: VitrineGalleryItem[];
}

export default function VitrineSectionRenderer({ section, config, announcements = [], gallery = [] }: Props) {
  const { slug } = useParams<{ slug: string }>();

  if (!section.visible) return null;

  switch (section.sectionType) {
    case "hero":
      return <VitrineHero section={section} config={config} />;
    case "text":
      return <VitrineTextBlock section={section} config={config} />;
    case "stats":
      return <VitrineStats section={section} config={config} />;
    case "cta":
      return <VitrineCTA section={section} config={config} />;
    case "gallery":
      return <VitrineGallery gallery={gallery} title={section.title} />;
    case "announcements":
      return <VitrineAnnouncements announcements={announcements} config={config} title={section.title} />;
    case "map":
      return <VitrineMap section={section} config={config} />;
    case "pre-inscription" as string:
    case "inscription" as string:
      return <VitrinePreInscription config={config} />;
    case "contact" as string:
      return <VitrineContactForm config={config} slug={slug || ""} />;
    default:
      return null;
  }
}
