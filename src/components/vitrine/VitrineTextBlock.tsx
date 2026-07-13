import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { VitrineSection, VitrineConfig } from "@/types/vitrine";

interface Props {
  section: VitrineSection;
  config?: VitrineConfig;
}

export default function VitrineTextBlock({ section, config }: Props) {
  const content = section.content as { body?: string; imageUrl?: string };
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const hasImage = !!content.imageUrl;
  const primaryColor = config?.primaryColor || "#3b82f6";

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`grid items-center gap-12 ${
            hasImage ? "lg:grid-cols-2" : "lg:grid-cols-1"
          }`}
        >
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={hasImage ? "" : "mx-auto max-w-4xl"}
          >
            {section.title && (
              <div className={hasImage ? "" : "text-center"}>
                {/* Decorative accent line */}
                <div
                  className={`mb-4 h-1 w-12 rounded-full ${
                    hasImage ? "" : "mx-auto"
                  }`}
                  style={{ backgroundColor: primaryColor }}
                />
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {section.title}
                </h2>
              </div>
            )}
            {content.body && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                className={`mt-6 prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900 prose-a:font-medium prose-strong:text-gray-800 ${
                  hasImage ? "" : "mx-auto text-center"
                }`}
                style={
                  {
                    "--tw-prose-links": primaryColor,
                  } as React.CSSProperties
                }
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            )}
          </motion.div>

          {/* Optional side image */}
          {hasImage && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            >
              {/* Decorative background shape */}
              <div
                className="absolute -right-4 -top-4 h-full w-full rounded-2xl"
                style={{ backgroundColor: primaryColor + "15" }}
              />
              <img
                src={content.imageUrl}
                alt={section.title || ""}
                className="relative z-10 w-full rounded-2xl object-cover shadow-xl"
                style={{ maxHeight: "500px" }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
