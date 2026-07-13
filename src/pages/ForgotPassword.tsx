import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle, GraduationCap, Sparkles } from "lucide-react";
import { authApi } from "@/api/auth.api";
import { useLanguage } from "@/hooks/useLanguage";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-mesh overflow-hidden p-4 md:p-8">
      {/* Animated mesh orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, hsl(230 75% 57% / 0.2), transparent 70%)" }}
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed -bottom-40 -right-40 h-[600px] w-[600px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, hsl(260 70% 60% / 0.15), transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl border border-border/50 bg-card/80 glass shadow-card-xl"
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center px-8 py-14 lg:px-14"
        >
          {/* Logo */}
          <motion.div variants={item} className="mb-10 flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-btn">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
              <div className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                <Sparkles className="h-2.5 w-2.5 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
                EcoleNet
              </h1>
              <p className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
                GESTION SCOLAIRE
              </p>
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-8 text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Mot de passe oubli&eacute; ?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Entrez votre adresse e-mail pour recevoir un lien de r&eacute;initialisation
            </p>
          </motion.div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[280px] space-y-6"
            >
              <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  Si un compte existe avec cet email, un lien de r&eacute;initialisation a &eacute;t&eacute; envoy&eacute;.
                </span>
              </div>
              <Link
                to="/"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex w-full max-w-[280px] items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="w-full max-w-[280px] space-y-4">
                <motion.div variants={item} className="relative">
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className={`absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focused ? "text-primary" : "text-muted-foreground"}`} />
                    <input
                      type="email"
                      placeholder="nom@ecole.fr"
                      value={email}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-muted/50 py-3 ps-10 pe-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:bg-card focus:outline-none focus:shadow-input-focus"
                    />
                  </div>
                </motion.div>

                <motion.div variants={item}>
                  <motion.button
                    whileHover={loading ? {} : { scale: 1.015, y: -1 }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-btn transition-shadow hover:shadow-lg disabled:opacity-80"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      t("auth.sendLink")
                    )}
                  </motion.button>
                </motion.div>

                <motion.div variants={item} className="text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la connexion
                  </Link>
                </motion.div>
              </form>
            </>
          )}

          <motion.p variants={item} className="mt-8 text-[10px] text-muted-foreground">
            &copy; 2026 EcoleNet — Tous droits r&eacute;serv&eacute;s
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
