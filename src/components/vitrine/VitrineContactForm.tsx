import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { VitrineConfig } from "@/types/vitrine";
import axios from "axios";
import env from "@/config/env";

interface Props {
  config: VitrineConfig;
  slug: string;
}

export default function VitrineContactForm({ config, slug }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${env.API_URL}/public/vitrine/${slug}/contact`, form, {
        headers: { "X-Tenant-ID": slug },
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-20">
        <motion.div
          className="mx-auto max-w-lg px-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            <CheckCircle2
              className="mx-auto h-20 w-20"
              style={{ color: config.primaryColor }}
            />
          </motion.div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Message envoye !
          </h2>
          <p className="mt-3 text-gray-600">
            Merci de nous avoir contactes. Nous vous repondrons dans les
            meilleurs delais.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setForm({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: "",
              });
            }}
          >
            Envoyer un autre message
          </Button>
        </motion.div>
      </section>
    );
  }

  return (
    <section ref={ref} className="py-20" style={{ backgroundColor: config.primaryColor + "05" }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="mb-10 text-center">
            <div
              className="mx-auto mb-4 h-1 w-12 rounded-full"
              style={{ backgroundColor: config.primaryColor }}
            />
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Contactez-nous
            </h2>
            <p className="mt-3 text-gray-500">
              Nous sommes la pour repondre a toutes vos questions
            </p>
          </div>

          {/* Form Card */}
          <motion.div
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700">
                    Nom complet *
                  </Label>
                  <Input
                    id="contact-name"
                    required
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Votre nom"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
                    Email *
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="votre@email.com"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact-phone" className="text-sm font-medium text-gray-700">
                    Telephone
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-subject" className="text-sm font-medium text-gray-700">
                    Sujet
                  </Label>
                  <Input
                    id="contact-subject"
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    placeholder="Objet de votre message"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700">
                  Message *
                </Label>
                <Textarea
                  id="contact-message"
                  required
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Ecrivez votre message ici..."
                  rows={5}
                  className="mt-1.5 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !form.name || !form.email || !form.message}
                className="w-full gap-2 py-6 text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                style={{ backgroundColor: config.primaryColor }}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
