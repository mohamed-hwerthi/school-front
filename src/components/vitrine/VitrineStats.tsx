import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Users, Award, Clock, type LucideIcon } from "lucide-react";
import type { VitrineSection, VitrineConfig } from "@/types/vitrine";

interface StatItem {
  label: string;
  value: string;
  icon?: string;
}

interface Props {
  section: VitrineSection;
  config: VitrineConfig;
}

const ICON_MAP: Record<string, LucideIcon> = {
  students: GraduationCap,
  teachers: Users,
  success: Award,
  years: Clock,
  graduation: GraduationCap,
  users: Users,
  award: Award,
  clock: Clock,
};

const DEFAULT_ICONS: LucideIcon[] = [GraduationCap, Users, Award, Clock];

function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);

  return count;
}

function parseNumericValue(value: string): { number: number; prefix: string; suffix: string } {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return { number: 0, prefix: "", suffix: value };
  return {
    prefix: match[1],
    number: parseInt(match[2].replace(/[,.]/g, ""), 10),
    suffix: match[3],
  };
}

function StatCard({
  stat,
  index,
  config,
  inView,
}: {
  stat: StatItem;
  index: number;
  config: VitrineConfig;
  inView: boolean;
}) {
  const parsed = parseNumericValue(stat.value);
  const count = useCountUp(parsed.number, 2000, inView);
  const getIcon = useCallback((): LucideIcon => {
    if (stat.icon && ICON_MAP[stat.icon.toLowerCase()]) {
      return ICON_MAP[stat.icon.toLowerCase()];
    }
    return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
  }, [stat.icon, index]);

  const Icon = getIcon();

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      {/* Decorative corner gradient */}
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: config.primaryColor }}
      />

      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl"
        style={{ backgroundColor: config.primaryColor + "15" }}
      >
        <Icon className="h-7 w-7" style={{ color: config.primaryColor }} />
      </div>

      <div
        className="text-4xl font-extrabold tracking-tight"
        style={{ color: config.primaryColor }}
      >
        {parsed.prefix}
        {parsed.number > 0 ? count : stat.value}
        {parsed.number > 0 ? parsed.suffix : ""}
      </div>

      <div className="mt-2 text-sm font-medium text-gray-500">
        {stat.label}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
        style={{ backgroundColor: config.primaryColor }}
      />
    </motion.div>
  );
}

export default function VitrineStats({ section, config }: Props) {
  const content = section.content as { stats?: StatItem[] };
  const stats = content.stats || [];
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  if (stats.length === 0) return null;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-20"
      style={{ backgroundColor: config.primaryColor + "06" }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(${config.primaryColor} 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div
              className="mx-auto mb-4 h-1 w-12 rounded-full"
              style={{ backgroundColor: config.primaryColor }}
            />
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {section.title}
            </h2>
          </motion.div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              stat={stat}
              index={i}
              config={config}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
