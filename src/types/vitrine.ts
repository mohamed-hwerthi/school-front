// Vitrine (showcase website) types

export interface VitrineConfig {
  id: string;
  schoolDisplayName: string;
  slogan: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themeTemplate: "modern" | "classic" | "minimal";
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  whatsappNumber: string | null;
  metaDescription: string | null;
  // Hero
  heroBadgeLabel: string | null;
  heroBadgeValue: string | null;
  heroStat1Value: string | null;
  heroStat1Label: string | null;
  heroStat2Value: string | null;
  heroStat2Label: string | null;
  heroStat3Value: string | null;
  heroStat3Label: string | null;
  // Marquee
  marqueeItem1: string | null;
  marqueeItem2: string | null;
  marqueeItem3: string | null;
  marqueeItem4: string | null;
  marqueeItem5: string | null;
  marqueeItem6: string | null;
  // Trust strip
  trustStat1Value: string | null;
  trustStat1Label: string | null;
  trustStat2Value: string | null;
  trustStat2Label: string | null;
  trustStat3Value: string | null;
  trustStat3Label: string | null;
  trustStat4Value: string | null;
  trustStat4Label: string | null;
  // About
  aboutEyebrow: string | null;
  aboutTitle: string | null;
  aboutTitleAccent: string | null;
  aboutDescription: string | null;
  aboutFeature1: string | null;
  aboutFeature2: string | null;
  aboutFeature3: string | null;
  aboutFeature4: string | null;
  aboutBadgeValue: string | null;
  aboutBadgeLabel: string | null;
  // Values
  value1Title: string | null;
  value1Text: string | null;
  value2Title: string | null;
  value2Text: string | null;
  value3Title: string | null;
  value3Text: string | null;
  // Programs
  program1Title: string | null;
  program1Level: string | null;
  program1Text: string | null;
  program2Title: string | null;
  program2Level: string | null;
  program2Text: string | null;
  program3Title: string | null;
  program3Level: string | null;
  program3Text: string | null;
  // Testimonial
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  testimonialRole: string | null;
  // CTA
  ctaEyebrow: string | null;
  ctaTitle: string | null;
  ctaDescription: string | null;
  ctaPrimaryLabel: string | null;
  ctaPrimaryUrl: string | null;
  // Localisation
  contactLatitude: number | null;
  contactLongitude: number | null;
  contactHours: string | null;
  published: boolean;
}

export interface VitrinePage {
  id: string;
  title: string;
  slug: string;
  displayOrder: number;
  visible: boolean;
  sections: VitrineSection[];
}

export interface VitrineSection {
  id: string;
  pageId: string;
  sectionType: "hero" | "text" | "gallery" | "stats" | "cta" | "testimonials" | "map" | "announcements";
  title: string | null;
  content: Record<string, unknown>;
  displayOrder: number;
  visible: boolean;
}

export interface VitrineGalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
  displayOrder: number;
}

export interface VitrineAnnouncement {
  id: string;
  title: string;
  body: string | null;
  pinned: boolean;
  published: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface VitrineAnalytics {
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  viewsByPage: Array<{ page: string; views: number }>;
  viewsByDay: Array<{ date: string; views: number }>;
}

export interface VitrineContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  replied: boolean;
  replyText: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface VitrinePublicData {
  slug: string;
  config: VitrineConfig;
  pages: VitrinePage[];
  announcements: VitrineAnnouncement[];
  gallery: VitrineGalleryItem[];
}
