import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { VitrineConfig, VitrineSection } from "@/types/vitrine";
import { resolveFileUrl } from "@/api/storage.api";

interface Props {
  section: VitrineSection;
  config: VitrineConfig;
}

export default function VitrineHero({ section, config }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const content = section.content as {
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
  };

  const bgImage = resolveFileUrl(config.heroImageUrl);
  const hasImage = !!bgImage;
  const sectionRef = useRef<HTMLElement>(null);

  const scrollToNext = () => {
    if (sectionRef.current) {
      const nextSection = sectionRef.current.nextElementSibling;
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background */}
      {hasImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 50%, ${config.primaryColor} 100%)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* Floating decorative shapes */}
      <motion.div
        className="absolute top-[15%] left-[10%] h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: config.accentColor }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[15%] h-80 w-80 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: config.secondaryColor }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 25, -15, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[40%] right-[30%] h-48 w-48 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: config.primaryColor }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Decorative geometric shapes */}
      <motion.div
        className="absolute top-[25%] right-[20%] h-16 w-16 rotate-45 border-2 border-white/10"
        animate={{ rotate: [45, 90, 45], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[30%] left-[20%] h-12 w-12 rounded-full border-2 border-white/10"
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center text-white">
        <motion.h1
          className="text-5xl font-black tracking-tight drop-shadow-lg sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {section.title || config.schoolDisplayName}
        </motion.h1>

        {(content.subtitle || config.slogan) && (
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg font-light text-white/90 drop-shadow-md sm:text-xl lg:text-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            {content.subtitle || config.slogan}
          </motion.p>
        )}

        {content.buttonText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <Button
              asChild
              size="lg"
              className="mt-10 px-8 py-6 text-lg font-semibold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: config.accentColor }}
            >
              <Link
                to={
                  content.buttonLink?.startsWith("/")
                    ? `/vitrine/${slug}${content.buttonLink}`
                    : content.buttonLink || "#"
                }
              >
                {content.buttonText}
              </Link>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Scroll-down indicator */}
      <motion.button
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
        onClick={scrollToNext}
        aria-label="Defiler vers le bas"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-8 w-8" />
        </motion.div>
      </motion.button>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          className="relative block h-[60px] w-full sm:h-[80px]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="white"
            opacity=".25"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            fill="white"
            opacity=".5"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
