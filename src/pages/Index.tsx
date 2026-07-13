import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, GraduationCap, ArrowRight, Sparkles, Loader2, AlertCircle, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/lib/auth-schema";
import schoolHero from "@/assets/school-hero.png";
import { useLanguage } from "@/hooks/useLanguage";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login, verify2FA, cancelTwoFactor, isAuthenticated, twoFactorPending, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [totpCode, setTotpCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const totpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // SUPER_ADMIN has an independent space; everyone else uses /dashboard.
      navigate(user?.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard", {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  // Focus TOTP input when 2FA step appears
  useEffect(() => {
    if (twoFactorPending && totpInputRef.current) {
      totpInputRef.current.focus();
    }
  }, [twoFactorPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      if (!response.twoFactorRequired) {
        navigate(response.user.role === "SUPER_ADMIN" ? "/super-admin" : "/dashboard");
      }
      // If 2FA required, twoFactorPending state will be set by useAuth
    } catch (err: any) {
      setError(err.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorPending) return;
    setError(null);
    setTwoFaLoading(true);
    try {
      await verify2FA(twoFactorPending.userId, totpCode);
      // Redirect handled by the role-aware isAuthenticated effect.
    } catch (err: any) {
      setError(err.message || "Code invalide");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleBackToLogin = () => {
    cancelTwoFactor();
    setTotpCode("");
    setError(null);
  };

  // Handle TOTP input — only allow digits, max 6
  const handleTotpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setTotpCode(val);
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
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed top-1/4 end-1/3 h-72 w-72 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(160 70% 42% / 0.15), transparent 70%)" }}
      />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 flex w-full max-w-[1000px] overflow-hidden rounded-3xl border border-border/50 bg-card/80 glass shadow-card-xl"
      >
        {/* Left: Visual side */}
        <div className="relative hidden w-[52%] overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-primary opacity-[0.07]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative flex h-full flex-col items-center justify-center p-10">
            <motion.img
              src={schoolHero}
              alt="École primaire"
              className="w-full max-w-sm drop-shadow-xl"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Plateforme complète de gestion
              </p>
              <h3 className="mt-1 font-heading text-lg font-bold text-foreground">
                Pour votre école primaire
              </h3>
            </motion.div>

            {/* Feature chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6 flex flex-wrap justify-center gap-2"
            >
              {["Élèves", "Notes", "Emploi du temps", "Présence"].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="rounded-full border border-border/60 bg-card/60 glass px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Right: Login Form / 2FA Form */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex w-full flex-col items-center justify-center px-8 py-14 lg:w-[48%] lg:px-14"
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

          {/* ── 2FA Verification Step ── */}
          {twoFactorPending ? (
            <>
              <motion.div variants={item} className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  {t("auth.twoFactor")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Saisissez le code de votre application d'authentification
                </p>
              </motion.div>

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

              <form onSubmit={handleVerify2FA} className="w-full max-w-[280px] space-y-4">
                <motion.div variants={item} className="relative">
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Code à 6 chiffres
                  </label>
                  <div className="relative">
                    <ShieldCheck className={`absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focused === "totp" ? "text-primary" : "text-muted-foreground"}`} />
                    <input
                      ref={totpInputRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={totpCode}
                      onFocus={() => setFocused("totp")}
                      onBlur={() => setFocused(null)}
                      onChange={handleTotpChange}
                      maxLength={6}
                      className="w-full rounded-xl border border-border bg-muted/50 py-3 ps-10 pe-4 text-center text-lg font-mono font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:bg-card focus:outline-none focus:shadow-input-focus"
                    />
                  </div>
                </motion.div>

                <motion.div variants={item}>
                  <motion.button
                    whileHover={twoFaLoading ? {} : { scale: 1.015, y: -1 }}
                    whileTap={twoFaLoading ? {} : { scale: 0.98 }}
                    type="submit"
                    disabled={twoFaLoading || totpCode.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-btn transition-shadow hover:shadow-lg disabled:opacity-80"
                  >
                    {twoFaLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        Vérifier
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>

                <motion.div variants={item} className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Retour à la connexion
                  </button>
                </motion.div>
              </form>
            </>
          ) : (
            /* ── Normal Login Step ── */
            <>
              <motion.div variants={item} className="mb-8 text-center">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  {t("auth.welcomeBack")}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("auth.signIn")}
                </p>
              </motion.div>

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
                {/* Email */}
                <motion.div variants={item} className="relative">
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    {t("auth.email")}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                    <input
                      type="email"
                      placeholder="nom@ecole.fr"
                      value={email}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 py-3 ps-10 pe-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:bg-card focus:outline-none focus:shadow-input-focus"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={item} className="relative">
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 ${focused === "pass" ? "text-primary" : "text-muted-foreground"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onFocus={() => setFocused("pass")}
                      onBlur={() => setFocused(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 py-3 ps-10 pe-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary focus:bg-card focus:outline-none focus:shadow-input-focus"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 hover:text-primary focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                {/* Forgot password */}
                <motion.div variants={item} className="text-end">
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    {t("auth.forgotPassword")}
                  </Link>
                </motion.div>

                {/* Submit */}
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
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        {t("auth.loginButton")}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </>
          )}

          <motion.p variants={item} className="mt-10 text-[10px] text-muted-foreground">
            © 2026 EcoleNet — Tous droits réservés
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
