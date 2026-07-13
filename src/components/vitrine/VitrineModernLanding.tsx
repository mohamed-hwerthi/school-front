import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  Award,
  GraduationCap,
  Users,
  BookOpen,
  Heart,
  ChevronRight,
  Facebook,
  Instagram,
  MessageCircle,
  Clock,
  Calendar,
  CheckCircle2,
  Star,
  Quote,
  Image as ImageIcon,
} from "lucide-react";
import type {
  VitrineConfig,
  VitrineAnnouncement,
  VitrineGalleryItem,
} from "@/types/vitrine";
import { resolveFileUrl } from "@/api/storage.api";
import VitrineContactForm from "@/components/vitrine/VitrineContactForm";

interface Props {
  config: VitrineConfig;
  announcements: VitrineAnnouncement[];
  gallery: VitrineGalleryItem[];
  slug: string;
}

export default function VitrineModernLanding({ config, announcements, gallery, slug }: Props) {
  return (
    <div className="overflow-x-hidden bg-[#FAFAF9] text-zinc-900">
      <ScrollProgress color={config.accentColor} />
      <ModernHero config={config} />
      <Marquee config={config} />
      <TrustStrip config={config} />
      <AboutSection config={config} />
      <ValuesSection config={config} />
      {gallery.length > 0 && <GalleryStrip gallery={gallery} config={config} />}
      <ProgramsSection config={config} />
      {announcements.length > 0 && (
        <AnnouncementsSection announcements={announcements} config={config} />
      )}
      <TestimonialSection config={config} />
      <ContactShowcase config={config} slug={slug} />
      <PreInscriptionCTA config={config} />
    </div>
  );
}

/* ───────────────────────────  SHARED UTILITIES  ─────────────────────────── */

/** Sticky thin progress bar at the top of the page. */
function ScrollProgress({ color }: { color: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      style={{ scaleX, backgroundColor: color, transformOrigin: "0% 50%" }}
      className="fixed left-0 right-0 top-0 z-[60] h-[3px]"
    />
  );
}

/** Image with graceful fallback when src is missing or fails to load. */
function SafeImage({
  src,
  alt,
  className,
  fallback,
  loading = "lazy",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback: ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return <>{fallback}</>;
  }
  return (
    <img
      src={resolveFileUrl(src)}
      alt={alt ?? ""}
      className={className}
      loading={loading}
      onError={() => setErrored(true)}
    />
  );
}

/** Initials in a styled colored circle — fallback for missing logo. */
function InitialsBadge({
  name,
  size = "md",
  bg,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  bg: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
  };
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-2xl font-bold text-white shadow-md`}
      style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)` }}
    >
      {initials}
    </div>
  );
}

/** Title that reveals character by character on mount. */
function SplitTitle({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <span className="inline-block">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
          style={{ transformOrigin: "bottom" }}
        >
          {c === " " ? " " : c}
        </motion.span>
      ))}
    </span>
  );
}

/** Continuous horizontal marquee. */
function Marquee({ config }: { config: VitrineConfig }) {
  const items = [
    config.marqueeItem1,
    config.marqueeItem2,
    config.marqueeItem3,
    config.marqueeItem4,
    config.marqueeItem5,
    config.marqueeItem6,
  ].filter((s): s is string => !!s && s.trim().length > 0);
  if (items.length === 0) return null;
  return (
    <section className="relative -mt-px overflow-hidden border-y border-zinc-200/70 bg-white py-6">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 text-2xl font-bold uppercase tracking-tight text-zinc-300 sm:text-3xl"
          >
            {item}
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: config.accentColor }}
            />
          </span>
        ))}
      </motion.div>
    </section>
  );
}

/** Number that counts from 0 to target when in view. */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

/** Card whose surface tracks the mouse with a soft spotlight. */
function SpotlightCard({
  className = "",
  spotlight,
  children,
}: {
  className?: string;
  spotlight: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);

  const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };
  const handleLeave = () => {
    x.set(-200);
    y.set(-200);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`group relative overflow-hidden ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useTransform([x, y], ([cx, cy]) =>
            `radial-gradient(360px circle at ${cx}px ${cy}px, ${spotlight}, transparent 70%)`
          ),
        }}
      />
      {children}
    </div>
  );
}

/** Button that subtly tracks the mouse cursor. */
function MagneticButton({
  href,
  children,
  className = "",
  style,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 18 });
  const y = useSpring(0, { stiffness: 200, damping: 18 });

  const handleMove = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    x.set(cx * 0.25);
    y.set(cy * 0.25);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y, ...style }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

/* ───────────────────────────  HERO  ─────────────────────────── */

function ModernHero({ config }: { config: VitrineConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const heroStats = [
    { value: config.heroStat1Value ?? "1500+", label: config.heroStat1Label ?? "Eleves" },
    { value: config.heroStat2Value ?? "98%", label: config.heroStat2Label ?? "Reussite" },
    { value: config.heroStat3Value ?? "25 ans", label: config.heroStat3Label ?? "Experience" },
  ];

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-[#0B1224]">
      {/* hero image overlay (behind gradients) — kept very subtle */}
      {config.heroImageUrl && (
        <div className="absolute inset-0">
          <img
            src={resolveFileUrl(config.heroImageUrl)}
            alt=""
            className="h-full w-full object-cover opacity-25"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1224]/80 via-[#0B1224]/90 to-[#0B1224]" />
        </div>
      )}

      {/* animated gradient mesh blobs */}
      <motion.div
        className="pointer-events-none absolute -top-48 -left-48 h-[640px] w-[640px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${config.primaryColor}88 0%, transparent 70%)` }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-48 -right-48 h-[720px] w-[720px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${config.accentColor}88 0%, transparent 70%)` }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-1/3 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${config.secondaryColor || config.accentColor}55 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* dotted grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative mx-auto grid min-h-[100svh] max-w-7xl gap-12 px-6 pt-32 pb-24 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:px-8"
      >
        {/* LEFT — copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: config.accentColor }} />
            {config.slogan || "L'excellence au quotidien"}
          </motion.div>

          <h1
            className="mt-7 font-heading text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]"
            style={{ textShadow: `0 0 80px ${config.accentColor}40` }}
          >
            <SplitTitle text={config.schoolDisplayName} />
            <motion.span
              className="ml-3 inline-block h-3 w-3 translate-y-2 rounded-full"
              style={{ backgroundColor: config.accentColor, boxShadow: `0 0 24px ${config.accentColor}` }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl"
          >
            {config.metaDescription ||
              "Un cadre d'excellence pour former les talents de demain, dans un environnement bienveillant et stimulant."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <MagneticButton
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-12px] transition-transform"
              style={{
                backgroundColor: config.accentColor,
                ['--tw-shadow-color' as never]: `${config.accentColor}99`,
                boxShadow: `0 18px 40px -10px ${config.accentColor}aa`,
              }}
            >
              Nous contacter
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </MagneticButton>
            <a
              href="#about"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-8 py-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Decouvrir l'ecole
            </a>
          </motion.div>

          {/* stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4"
          >
            {heroStats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-4">
                {i > 0 && <span className="h-10 w-px bg-white/10" />}
                <div>
                  <p
                    className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl"
                    style={{ textShadow: `0 0 20px ${config.accentColor}55` }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto hidden w-full max-w-md lg:block"
        >
          <HeroVisual config={config} />
        </motion.div>
      </motion.div>

      {/* scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block"
        >
          Defiler
        </motion.span>
      </motion.div>
    </section>
  );
}

/** Decorative visual shown next to the hero copy. Uses heroImageUrl if set,
 *  otherwise renders an animated gradient card with the school logo/initials. */
function HeroVisual({ config }: { config: VitrineConfig }) {
  return (
    <div className="relative">
      {/* glow halo */}
      <div
        className="absolute -inset-8 rounded-[3rem] blur-3xl opacity-50"
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.accentColor} 100%)`,
        }}
      />
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
        <SafeImage
          src={config.heroImageUrl}
          className="h-full w-full object-cover"
          fallback={
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.accentColor} 100%)`,
              }}
            >
              <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-black/20 blur-3xl" />
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              {config.logoUrl ? (
                <SafeImage
                  src={config.logoUrl}
                  className="relative z-10 h-32 w-32 rounded-3xl object-cover shadow-2xl"
                  fallback={<InitialsBadge name={config.schoolDisplayName} size="lg" bg={config.accentColor} />}
                />
              ) : (
                <GraduationCap className="relative z-10 h-32 w-32 text-white/80" strokeWidth={1.2} />
              )}
            </div>
          }
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
      </div>

      {/* floating accent card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="absolute -left-6 bottom-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B1224]/80 px-5 py-3.5 shadow-2xl backdrop-blur"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: config.accentColor + "30", color: config.accentColor }}
        >
          <Award className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            {config.heroBadgeLabel ?? "Certifie"}
          </p>
          <p className="text-sm font-semibold text-white">{config.heroBadgeValue ?? "Ministere de l'Education"}</p>
        </div>
      </motion.div>

      {/* floating star badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
        className="absolute -right-4 top-8 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-2xl"
      >
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      </motion.div>
    </div>
  );
}

/* ───────────────────────────  TRUST STRIP  ─────────────────────────── */

function TrustStrip({ config }: { config: VitrineConfig }) {
  // Parse "1500+" → { to: 1500, suffix: "+" } for the count-up animation.
  // Fallback to plain text when the value isn't numeric.
  const parse = (raw: string | null | undefined, fallback: { to: number; suffix: string }) => {
    if (!raw) return fallback;
    const m = raw.trim().match(/^(\d+(?:[.,]\d+)?)(.*)$/);
    if (!m) return { to: 0, suffix: raw.trim() };
    return { to: parseFloat(m[1].replace(",", ".")), suffix: m[2].trim() };
  };
  const items = [
    { icon: GraduationCap, ...parse(config.trustStat1Value, { to: 1500, suffix: "+" }), label: config.trustStat1Label ?? "Eleves formes" },
    { icon: Users,         ...parse(config.trustStat2Value, { to: 60,   suffix: "+" }), label: config.trustStat2Label ?? "Enseignants" },
    { icon: BookOpen,      ...parse(config.trustStat3Value, { to: 20,   suffix: "+" }), label: config.trustStat3Label ?? "Programmes" },
    { icon: Award,         ...parse(config.trustStat4Value, { to: 25,   suffix: ""  }), label: config.trustStat4Label ?? "Annees d'expertise" },
  ];

  return (
    <section className="relative -mt-16 z-10 px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] sm:grid-cols-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <SpotlightCard
              key={it.label}
              spotlight={`${config.accentColor}20`}
              className="bg-white"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex items-center gap-4 p-6 sm:flex-col sm:items-start sm:gap-3"
              >
                <Icon className="h-6 w-6 transition-transform duration-500 group-hover:scale-110" style={{ color: config.primaryColor }} />
                <div>
                  <p className="font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                    <CountUp to={it.to} suffix={it.suffix} />
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">{it.label}</p>
                </div>
              </motion.div>
            </SpotlightCard>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────────  ABOUT  ─────────────────────────── */

function AboutSection({ config }: { config: VitrineConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const features = [
    config.aboutFeature1,
    config.aboutFeature2,
    config.aboutFeature3,
    config.aboutFeature4,
  ].filter((s): s is string => !!s && s.trim().length > 0);

  return (
    <section id="about" ref={ref} className="px-6 py-28 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: config.accentColor }}
          >
            {config.aboutEyebrow ?? "A propos de nous"}
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            {config.aboutTitle ?? "Une education exigeante,"}<br />
            <span style={{ color: config.primaryColor }}>
              {config.aboutTitleAccent ?? "tournee vers l'avenir."}
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600">
            {config.aboutDescription || config.slogan || "Nous accompagnons chaque eleve avec rigueur et bienveillance."}
          </p>

          {features.length > 0 && (
            <div className="mt-8 space-y-3">
              {features.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-zinc-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: config.accentColor }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl">
            <SafeImage
              src={config.heroImageUrl}
              className="h-full w-full object-cover"
              fallback={
                <div
                  className="flex h-full items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.accentColor} 100%)`,
                  }}
                >
                  <GraduationCap className="h-32 w-32 text-white/30" />
                </div>
              }
            />
            {/* subtle vignette for elegance — only shows when image present */}
            {config.heroImageUrl && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-zinc-900/30 via-transparent to-transparent" />
            )}
          </div>
          {/* floating badge */}
          <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-zinc-200/50">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: config.accentColor + "20", color: config.accentColor }}
              >
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{config.aboutBadgeValue ?? "98%"}</p>
                <p className="text-xs text-zinc-500">{config.aboutBadgeLabel ?? "Taux de reussite"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────  VALUES  ─────────────────────────── */

function ValuesSection({ config }: { config: VitrineConfig }) {
  const values = [
    { icon: GraduationCap, title: config.value1Title ?? "Excellence academique", text: config.value1Text ?? "Un cursus exigeant aligne sur les meilleurs standards." },
    { icon: Heart,         title: config.value2Title ?? "Bienveillance",         text: config.value2Text ?? "Un cadre humain, a l'ecoute et respectueux." },
    { icon: Sparkles,      title: config.value3Title ?? "Innovation",            text: config.value3Text ?? "Des methodes pedagogiques modernes, numeriques et engageantes." },
  ];

  return (
    <section className="bg-white px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: config.accentColor }}
          >
            Nos valeurs
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Ce qui nous distingue
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <SpotlightCard
                key={v.title}
                spotlight={`${config.accentColor}25`}
                className="rounded-3xl border border-zinc-200/70 bg-[#FAFAF9] transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative p-8"
                >
                  <div
                    className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: config.primaryColor + "15", color: config.primaryColor }}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-zinc-900">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{v.text}</p>
                </motion.div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  GALLERY STRIP  ─────────────────────────── */

const GALLERY_PALETTES = [
  { from: "#6366F1", to: "#EC4899", icon: "🎓" },
  { from: "#10B981", to: "#0EA5E9", icon: "📚" },
  { from: "#F59E0B", to: "#EF4444", icon: "🏆" },
  { from: "#8B5CF6", to: "#6366F1", icon: "🎨" },
  { from: "#EC4899", to: "#F59E0B", icon: "✨" },
  { from: "#0EA5E9", to: "#10B981", icon: "🌟" },
];

function pickIconForCaption(caption?: string | null): string {
  if (!caption) return "🏫";
  const c = caption.toLowerCase();
  if (c.includes("cour") || c.includes("recreation") || c.includes("récréation")) return "🌳";
  if (c.includes("salle") || c.includes("classe")) return "📚";
  if (c.includes("biblio")) return "📖";
  if (c.includes("fete") || c.includes("fête") || c.includes("celebration")) return "🎉";
  if (c.includes("sport") || c.includes("competition") || c.includes("compétition")) return "🏆";
  if (c.includes("musique") || c.includes("art")) return "🎨";
  if (c.includes("labo") || c.includes("science")) return "🔬";
  if (c.includes("informatique") || c.includes("ordinateur")) return "💻";
  return "🏫";
}

function GalleryStrip({ gallery, config }: { gallery: VitrineGalleryItem[]; config: VitrineConfig }) {
  const items = gallery.slice(0, 6);
  return (
    <section className="px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: config.accentColor }}
            >
              Galerie
            </p>
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              La vie a l'ecole
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item, i) => {
            const palette = GALLERY_PALETTES[i % GALLERY_PALETTES.length];
            const isWide = i === 0 || i === 3;
            return (
              <motion.figure
                key={item.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-3xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] ${
                  isWide ? "row-span-2 aspect-[3/4]" : "aspect-square"
                }`}
              >
                <SafeImage
                  src={item.imageUrl}
                  alt={item.caption ?? ""}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  fallback={
                    <div
                      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-5"
                      style={{
                        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
                      }}
                    >
                      {/* mesh accent blobs */}
                      <div
                        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/30 blur-3xl"
                      />
                      <div
                        className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-black/10 blur-3xl"
                      />
                      {/* dotted grid pattern */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                          backgroundSize: "12px 12px",
                        }}
                      />

                      {/* floating emoji + caption */}
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/25 text-3xl shadow-lg backdrop-blur sm:h-20 sm:w-20 sm:text-4xl"
                      >
                        {pickIconForCaption(item.caption)}
                      </motion.div>
                      {item.caption && (
                        <p className="relative z-10 text-center text-[11px] font-bold uppercase leading-tight tracking-wider text-white drop-shadow-md sm:text-xs">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  }
                />
                {/* hover overlay (only meaningful when there's a real image) */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {item.caption && (
                  <figcaption className="pointer-events-none absolute bottom-4 left-4 right-4 translate-y-2 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {item.caption}
                  </figcaption>
                )}
              </motion.figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  PROGRAMS  ─────────────────────────── */

function ProgramsSection({ config }: { config: VitrineConfig }) {
  const programs = [
    { title: config.program1Title ?? "Maternelle", level: config.program1Level ?? "3 - 5 ans", text: config.program1Text ?? "Eveil, sociabilisation et premiers apprentissages." },
    { title: config.program2Title ?? "Primaire",   level: config.program2Level ?? "6 - 11 ans", text: config.program2Text ?? "Acquisition des fondamentaux : lecture, ecriture, calcul." },
    { title: config.program3Title ?? "College",    level: config.program3Level ?? "12 - 15 ans", text: config.program3Text ?? "Approfondissement, autonomie et orientation." },
  ];

  return (
    <section className="bg-[#0F172A] px-6 py-28 text-white lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: config.accentColor }}
          >
            Nos programmes
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Un parcours adapte<br />a chaque age.
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {programs.map((p, i) => (
            <SpotlightCard
              key={p.title}
              spotlight={`${config.accentColor}40`}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur transition-all hover:bg-white/[0.08]"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-8"
              >
                <span
                  className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: config.accentColor + "20", color: config.accentColor }}
                >
                  {p.level}
                </span>
                <h3 className="mt-5 font-heading text-2xl font-bold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{p.text}</p>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-white/80 transition-colors group-hover:text-white">
                  En savoir plus
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  ANNOUNCEMENTS  ─────────────────────────── */

function AnnouncementsSection({
  announcements,
  config,
}: {
  announcements: VitrineAnnouncement[];
  config: VitrineConfig;
}) {
  const items = announcements.slice(0, 3);
  return (
    <section className="px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: config.accentColor }}>
              Actualites
            </p>
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Dernieres annonces
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((a, i) => (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-3xl border border-zinc-200/70 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                {a.pinned && (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: config.accentColor + "20", color: config.accentColor }}
                  >
                    Epingle
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-heading text-xl font-bold leading-tight text-zinc-900">
                {a.title}
              </h3>
              {a.body && (
                <div
                  className="prose prose-sm prose-zinc mt-3 line-clamp-3 max-w-none text-sm leading-relaxed text-zinc-600"
                  dangerouslySetInnerHTML={{ __html: a.body }}
                />
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  TESTIMONIAL  ─────────────────────────── */

function TestimonialSection({ config }: { config: VitrineConfig }) {
  return (
    <section className="px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200/70 bg-white p-10 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.2)] sm:p-16"
        >
          <Quote
            className="absolute right-8 top-8 h-24 w-24 opacity-[0.07]"
            style={{ color: config.primaryColor }}
          />
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: config.accentColor }}>
            Temoignage
          </p>
          <blockquote className="mt-6 font-heading text-2xl font-medium leading-snug text-zinc-900 sm:text-3xl">
            « {config.testimonialQuote ?? "Une equipe a l'ecoute, des methodes modernes, et surtout des enfants epanouis qui aiment venir a l'ecole."} »
          </blockquote>
          <div className="mt-8 flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              {(config.testimonialAuthor ?? "S B").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"}
            </div>
            <div>
              <p className="font-semibold text-zinc-900">{config.testimonialAuthor ?? "Salma B."}</p>
              <p className="text-sm text-zinc-500">{config.testimonialRole ?? "Parent d'eleve"}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────  CONTACT SHOWCASE  ─────────────────────────── */

function ContactShowcase({ config, slug }: { config: VitrineConfig; slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const cleanPhone = config.contactPhone?.replace(/\D/g, "") ?? "";
  const cleanWhats = config.whatsappNumber?.replace(/\D/g, "") ?? "";

  return (
    <section id="contact" ref={ref} className="bg-[#0F172A] px-6 py-28 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: config.accentColor }}>
            Contact
          </p>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Une question ? Parlons-nous.
          </h2>
          <p className="mt-5 text-lg text-white/60">
            Notre equipe est a votre disposition pour repondre a toutes vos demandes.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          {/* contact cards */}
          <div className="space-y-4 lg:col-span-2">
            {[
              { icon: Phone, label: "Telephone", value: config.contactPhone, href: cleanPhone ? `tel:${cleanPhone}` : undefined },
              { icon: Mail, label: "Email", value: config.contactEmail, href: config.contactEmail ? `mailto:${config.contactEmail}` : undefined },
              { icon: MapPin, label: "Adresse", value: config.contactAddress },
              { icon: Clock, label: "Horaires", value: config.contactHours ?? "Lun - Ven : 8h - 17h" },
            ].filter((i) => i.value).map((item, i) => {
              const Icon = item.icon;
              const inner = (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.08]"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: config.accentColor + "20", color: config.accentColor }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-medium text-white">{item.value}</p>
                  </div>
                </motion.div>
              );
              return item.href ? (
                <a key={item.label} href={item.href} className="block">{inner}</a>
              ) : (
                <div key={item.label}>{inner}</div>
              );
            })}

            {/* social row */}
            <div className="flex flex-wrap gap-3 pt-2">
              {config.facebookUrl && (
                <SocialPill href={config.facebookUrl} icon={Facebook} label="Facebook" color="#1877F2" />
              )}
              {config.instagramUrl && (
                <SocialPill href={config.instagramUrl} icon={Instagram} label="Instagram" color="#E4405F" />
              )}
              {cleanWhats && (
                <SocialPill href={`https://wa.me/${cleanWhats}`} icon={MessageCircle} label="WhatsApp" color="#25D366" />
              )}
            </div>
          </div>

          {/* map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:col-span-3"
          >
            <div className="relative aspect-[4/3] w-full lg:aspect-auto lg:h-full lg:min-h-[480px]">
              {(() => {
                const lat = config.contactLatitude != null ? Number(config.contactLatitude) : 33.5731;
                const lon = config.contactLongitude != null ? Number(config.contactLongitude) : -7.5898;
                // ±0.005° around the marker — roughly 500m zoom on city scale
                const d = 0.005;
                const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
                return (
                  <iframe
                    title="Localisation"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "grayscale(0.3) contrast(1.1)" }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
                  />
                );
              })()}
              {(config.contactAddress || (config.contactLatitude != null && config.contactLongitude != null)) && (
                <a
                  href={
                    config.contactLatitude != null && config.contactLongitude != null
                      ? `https://www.google.com/maps/search/?api=1&query=${config.contactLatitude},${config.contactLongitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.contactAddress ?? "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-lg transition-transform hover:scale-105"
                >
                  Itineraire <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        </div>

        <div className="mt-16">
          <VitrineContactForm config={config} slug={slug} />
        </div>
      </div>
    </section>
  );
}

function SocialPill({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: typeof Facebook;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
    >
      <Icon className="h-4 w-4" style={{ color }} />
      {label}
    </a>
  );
}

/* ───────────────────────────  PRE-INSCRIPTION CTA  ─────────────────────────── */

function PreInscriptionCTA({ config }: { config: VitrineConfig }) {
  return (
    <section className="px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.5rem] p-12 shadow-2xl sm:p-16"
          style={{
            background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.accentColor} 100%)`,
          }}
        >
          {/* decorative blobs */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                {config.ctaEyebrow ?? "Inscriptions ouvertes"}
              </p>
              <h2 className="mt-4 font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
                {config.ctaTitle ?? "Prets a rejoindre notre famille ?"}
              </h2>
              <p className="mt-5 max-w-md text-lg text-white/80">
                {config.ctaDescription ?? "Pre-inscrivez votre enfant en ligne en quelques minutes."}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <a
                href={config.ctaPrimaryUrl ?? "/inscription"}
                className="group inline-flex w-fit items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-zinc-900 shadow-xl transition-transform hover:scale-[1.02]"
              >
                {config.ctaPrimaryLabel ?? "Pre-inscription en ligne"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              {config.contactPhone && (
                <a
                  href={`tel:${config.contactPhone}`}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {config.contactPhone}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
