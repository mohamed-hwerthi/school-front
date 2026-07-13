import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import type { VitrineSection, VitrineConfig } from "@/types/vitrine";

interface Props {
  section: VitrineSection;
  config: VitrineConfig;
}

interface ContactCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  delay: number;
  inView: boolean;
  primaryColor: string;
}

function ContactCard({ icon, label, value, href, delay, inView, primaryColor }: ContactCardProps) {
  const content = (
    <motion.div
      className="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: primaryColor + "15" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}

export default function VitrineMap({ section, config }: Props) {
  const content = section.content as {
    latitude?: number;
    longitude?: number;
    openingHours?: string;
  };

  const lat = content.latitude || 33.5731;
  const lng = content.longitude || -7.5898;
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const contactItems: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    href?: string;
  }> = [];

  if (config.contactAddress) {
    contactItems.push({
      icon: <MapPin className="h-5 w-5" style={{ color: config.primaryColor }} />,
      label: "Adresse",
      value: config.contactAddress,
    });
  }
  if (config.contactPhone) {
    contactItems.push({
      icon: <Phone className="h-5 w-5" style={{ color: config.primaryColor }} />,
      label: "Telephone",
      value: config.contactPhone,
      href: `tel:${config.contactPhone}`,
    });
  }
  if (config.contactEmail) {
    contactItems.push({
      icon: <Mail className="h-5 w-5" style={{ color: config.primaryColor }} />,
      label: "Email",
      value: config.contactEmail,
      href: `mailto:${config.contactEmail}`,
    });
  }
  if (content.openingHours) {
    contactItems.push({
      icon: <Clock className="h-5 w-5" style={{ color: config.primaryColor }} />,
      label: "Horaires",
      value: content.openingHours,
    });
  }

  return (
    <section ref={ref} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <motion.div
            className="mb-12 text-center"
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

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            {contactItems.map((item, i) => (
              <ContactCard
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
                href={item.href}
                delay={i * 0.1}
                inView={inView}
                primaryColor={config.primaryColor}
              />
            ))}

            {contactItems.length === 0 && (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 p-8">
                <p className="text-sm text-gray-400">
                  Aucune information de contact configuree.
                </p>
              </div>
            )}
          </div>

          {/* Map */}
          <motion.div
            className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="aspect-[4/3] w-full">
              <iframe
                title="Localisation"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
