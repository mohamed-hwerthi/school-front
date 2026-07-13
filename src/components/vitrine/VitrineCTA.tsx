import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { VitrineSection, VitrineConfig } from "@/types/vitrine";

interface Props {
  section: VitrineSection;
  config: VitrineConfig;
}

export default function VitrineCTA({ section, config }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const content = section.content as {
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24"
      style={{
        clipPath: "polygon(0 5%, 100% 0%, 100% 95%, 0% 100%)",
        background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`,
      }}
    >
      {/* Floating decorative dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-white/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Large decorative circle */}
      <div
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-10"
        style={{ backgroundColor: config.accentColor }}
      />
      <div
        className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-10"
        style={{ backgroundColor: "white" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {section.title && (
              <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {section.title}
              </h2>
            )}
            {content.description && (
              <p className="mt-6 text-lg leading-relaxed text-white/85">
                {content.description}
              </p>
            )}
            {content.buttonText && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              >
                <Button
                  asChild
                  size="lg"
                  className="group relative overflow-hidden bg-white px-8 py-6 text-base font-semibold shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{ color: config.primaryColor }}
                >
                  <Link
                    to={
                      content.buttonLink?.startsWith("/")
                        ? `/vitrine/${slug}${content.buttonLink}`
                        : content.buttonLink || "#"
                    }
                  >
                    {content.buttonText}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    {/* Glow effect on hover */}
                    <span
                      className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        boxShadow: `0 0 40px ${config.primaryColor}40`,
                      }}
                    />
                  </Link>
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Decorative illustration / shapes on right */}
          <motion.div
            className="relative hidden lg:flex lg:items-center lg:justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <div className="relative h-80 w-80">
              {/* Outer ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              {/* Middle ring */}
              <motion.div
                className="absolute inset-8 rounded-full border-2 border-dashed border-white/15"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              {/* Inner circle */}
              <div className="absolute inset-16 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <div className="text-center text-white">
                  <div className="text-5xl font-black">{config.schoolDisplayName.charAt(0)}</div>
                </div>
              </div>
              {/* Orbiting dots */}
              {[0, 90, 180, 270].map((angle, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40"
                  animate={{
                    x: [
                      Math.cos(((angle + 0) * Math.PI) / 180) * 130,
                      Math.cos(((angle + 360) * Math.PI) / 180) * 130,
                    ],
                    y: [
                      Math.sin(((angle + 0) * Math.PI) / 180) * 130,
                      Math.sin(((angle + 360) * Math.PI) / 180) * 130,
                    ],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
