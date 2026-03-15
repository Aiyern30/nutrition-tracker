"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Github,
  AlertCircle,
  LayoutDashboard,
  Brain,
  Utensils,
  MessageSquare,
  BarChart3,
  UserCircle,
  Droplets,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
  Variants,
} from "framer-motion";

// ── Animation Variants ──────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Scroll-triggered wrapper ────────────────────────────────────────────────

function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description:
      "At-a-glance stats for daily calories, water intake, and macro distribution with beautiful glassmorphism UI.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    icon: Brain,
    title: "AI Food Analyzer",
    description:
      "Upload a photo or describe your meal — our Ernie 5.0 AI instantly calculates nutrition, macros, and health insights.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "rgba(16,185,129,0.15)",
  },
  {
    icon: Utensils,
    title: "Intelligent Meal Planner",
    description:
      "Generate personalized 7-day meal plans tailored to your dietary restrictions, goals, and preferences.",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "rgba(249,115,22,0.15)",
  },
  {
    icon: MessageSquare,
    title: "Smart Nutrition Chatbot",
    description:
      "Chat with an AI nutritionist that knows your profile. Bilingual support for English and Mandarin Chinese.",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "rgba(14,165,233,0.15)",
  },
  {
    icon: BarChart3,
    title: "Daily Summaries & Reports",
    description:
      "Visualize 7-day, 30-day, or all-time trends with interactive charts and an AI-calculated Diet Quality Score.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    glow: "rgba(236,72,153,0.15)",
  },
  {
    icon: UserCircle,
    title: "Personalized Profile",
    description:
      "Set custom calorie, macro, and water goals. Manage dietary restrictions and switch between Light/Dark themes.",
    color: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    glow: "rgba(99,102,241,0.15)",
  },
];

const highlights = [
  "Powered by Baidu Ernie 5.0 Thinking LLM",
  "Image & text-based food recognition",
  "Bilingual (EN / 中文) interface",
  "Secure OAuth — no passwords needed",
];

const stats = [
  { value: "6+", label: "Core Features" },
  { value: "AI", label: "Ernie 5.0 LLM" },
  { value: "2", label: "Languages Supported" },
  { value: "∞", label: "Meal Combinations" },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Parallax for hero blobs
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setLoading(provider);
      setError(null);
      const getRedirectUrl = () => {
        if (typeof window === "undefined") return undefined;
        return `${window.location.origin}/auth/callback`;
      };
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getRedirectUrl(), skipBrowserRedirect: false },
      });
      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during sign in",
      );
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/80 border-b border-border/50"
      >
        <motion.div
          className="flex items-center gap-2.5"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
            <Image
              src="/Logo.png"
              alt="Eat Smart AI Logo"
              width={20}
              height={20}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-lg font-bold tracking-tight">Eat Smart AI</span>
        </motion.div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          <div className="hidden sm:flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                onClick={() => handleOAuthLogin("google")}
                disabled={loading !== null}
                variant="outline"
                className="flex items-center gap-2 rounded-full px-4 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                {loading === "google" ? (
                  <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Google
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                onClick={() => handleOAuthLogin("github")}
                disabled={loading !== null}
                className="flex items-center gap-2 rounded-full px-4 bg-primary hover:bg-primary/90 shadow-md shadow-primary/30 transition-all"
              >
                {loading === "github" ? (
                  <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Github className="h-4 w-4" />
                )}
                GitHub
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen px-6 flex flex-col items-center justify-center text-center overflow-hidden"
      >
        {/* ── Floating particles ── */}
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${4 + (i % 5) * 3}px`,
              height: `${4 + (i % 5) * 3}px`,
              left: `${5 + ((i * 37) % 90)}%`,
              top: `${10 + ((i * 53) % 80)}%`,
              background:
                i % 3 === 0
                  ? "hsl(var(--primary))"
                  : i % 3 === 1
                    ? "#a78bfa"
                    : "#34d399",
              opacity: 0.15 + (i % 4) * 0.06,
            }}
            animate={{
              y: [0, -(20 + (i % 4) * 15), 0],
              x: [0, (i % 2 === 0 ? 1 : -1) * (8 + (i % 3) * 6), 0],
              opacity: [
                0.1 + (i % 4) * 0.05,
                0.25 + (i % 4) * 0.05,
                0.1 + (i % 4) * 0.05,
              ],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 4 + (i % 5) * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i * 0.4) % 3,
            }}
          />
        ))}

        {/* ── Animated grid lines ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        {/* ── Animated background blobs ── */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            y: blobY,
          }}
        />
        <motion.div
          animate={{
            x: [-20, 20, -20],
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
            y: blobY2,
          }}
        />
        <motion.div
          animate={{
            x: [20, -20, 20],
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-40 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #34d399 0%, transparent 70%)",
          }}
        />
        {/* Extra accent blob bottom */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
          }}
        />

        {/* ── Badge ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
        >
          {/* Animated border shimmer */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["-200% 0%", "200% 0%"] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1,
            }}
          />
          <motion.span
            animate={{ rotate: [0, 15, -10, 15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.span>
          Powered by Baidu Ernie 5.0 Thinking
        </motion.div>

        {/* ── Headline — word by word ── */}
        <motion.h1
          className="relative text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.12, delayChildren: 0.3 },
            },
          }}
        >
          {["Eat", "Smarter,"].map((word) => (
            <motion.span
              key={word}
              className="inline-block mr-[0.25em]"
              variants={{
                hidden: { opacity: 0, y: 40, rotateX: -30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              style={{ transformOrigin: "bottom center" }}
            >
              {word}
            </motion.span>
          ))}
          {/* Gradient "Live Better" — animates in as one word, hover jiggles letters */}{" "}
          <motion.span
            className="inline-block bg-clip-text text-transparent bg-linear-to-r from-primary via-violet-500 to-emerald-500"
            variants={{
              hidden: { opacity: 0, y: 40, scale: 0.9 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            whileHover={{
              scale: 1.04,
              transition: { type: "spring", stiffness: 300, damping: 15 },
            }}
          >
            Live Better
          </motion.span>
        </motion.h1>

        {/* ── Subtitle — word by word ── */}
        <motion.p
          className="relative mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.03, delayChildren: 0.9 },
            },
          }}
        >
          {"Your AI-powered nutrition companion. Track meals, analyze food with a photo, plan your week, and chat with a smart nutritionist — all in one beautifully designed app."
            .split(" ")
            .map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.3em]"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                {word}
              </motion.span>
            ))}
        </motion.p>

        {/* ── Highlights ── */}
        <motion.ul
          className="relative mt-8 flex flex-wrap justify-center gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.12, delayChildren: 1.4 },
            },
          }}
        >
          {highlights.map((h) => (
            <motion.li
              key={h}
              variants={{
                hidden: { opacity: 0, x: -20, scale: 0.9 },
                visible: {
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              whileHover={{ scale: 1.05, x: 3 }}
              className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 rounded-full border border-border/30 bg-muted/20 backdrop-blur-sm"
            >
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 1.5,
                }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              </motion.span>
              {h}
            </motion.li>
          ))}
        </motion.ul>

        {/* ── CTA Buttons in Hero ── */}
        <motion.div
          className="relative mt-10 flex flex-col sm:flex-row items-center gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.12, delayChildren: 1.8 },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={() => handleOAuthLogin("google")}
              disabled={loading !== null}
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              {loading === "google" ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Connecting…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </div>
              )}
            </Button>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              onClick={() => handleOAuthLogin("github")}
              disabled={loading !== null}
              size="lg"
              className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
            >
              {loading === "github" ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Connecting…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Github className="h-5 w-5" />
                  Sign in with GitHub
                </div>
              )}
            </Button>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              className="relative mt-6"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scroll cue ── */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
        >
          <motion.span
            className="text-xs text-muted-foreground/50 tracking-widest uppercase"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            scroll
          </motion.span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-border/40 flex items-start justify-center pt-1.5"
          >
            <motion.div
              className="w-1 h-2 rounded-full bg-muted-foreground/40"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Banner ── */}
      <RevealSection>
        <section className="px-6 py-10 border-y border-border/50 bg-muted/30">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i * 0.1}
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.06 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-primary to-violet-500">
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* ── Features Grid ── */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="text-center mb-14">
              <motion.h2
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              >
                Everything you need to{" "}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-emerald-500">
                  eat well
                </span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={0.1}
                className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto"
              >
                A complete nutrition toolkit built around AI, so every meal
                decision is informed and intentional.
              </motion.p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              const ref = useRef(null);
              const inView = useInView(ref, { once: true, margin: "-60px" });
              return (
                <motion.div
                  key={feat.title}
                  ref={ref}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  variants={scaleIn}
                  custom={i * 0.07}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: `0 0 30px 4px ${feat.glow}`,
                    transition: { duration: 0.2 },
                  }}
                  className={`group relative p-6 rounded-2xl border ${feat.border} ${feat.bg} cursor-default`}
                >
                  <motion.div
                    className={`w-11 h-11 rounded-xl bg-linear-to-br ${feat.color} flex items-center justify-center mb-4 shadow-md`}
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </motion.div>
                  <h3 className="font-semibold text-base mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Water Tracking Callout ── */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-500/20 via-blue-500/10 to-background border border-sky-500/20 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8"
            >
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, #38bdf8 0%, transparent 60%)",
                }}
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="shrink-0 w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center"
              >
                <Droplets className="h-8 w-8 text-sky-400" />
              </motion.div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  Hydration Tracking Built-In
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-lg">
                  Effortlessly log your daily water intake with one-tap
                  controls. Eat Smart AI reminds you to stay hydrated so you
                  never miss your daily water goal.
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Button
                    onClick={() => handleOAuthLogin("google")}
                    disabled={loading !== null}
                    className="rounded-full px-6 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all"
                  >
                    Try It Free
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <RevealSection>
            <motion.h2
              variants={fadeUp}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
            >
              Ready to transform{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-violet-500 to-emerald-500">
                the way you eat?
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.1}
              className="text-muted-foreground text-lg mb-10"
            >
              Join Eat Smart AI today — completely free, no credit card
              required.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={0.2}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  id="cta-google"
                  onClick={() => handleOAuthLogin("google")}
                  disabled={loading !== null}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 h-12 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {loading === "google" ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Connecting…</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </div>
                  )}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  id="cta-github"
                  onClick={() => handleOAuthLogin("github")}
                  disabled={loading !== null}
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-8 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
                >
                  {loading === "github" ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Connecting…</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <Github className="h-5 w-5" />
                      Sign in with GitHub
                    </div>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <RevealSection>
        <motion.footer
          variants={fadeIn}
          className="border-t border-border/50 px-6 py-8"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Image
                  src="/Logo.png"
                  alt="Eat Smart AI"
                  width={14}
                  height={14}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-foreground">
                Eat Smart AI
              </span>
            </motion.div>
            <p>
              For educational purposes only — not a substitute for medical
              advice.
            </p>
            <motion.a
              href="https://github.com/Aiyern30/nutrition-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </motion.a>
          </div>
        </motion.footer>
      </RevealSection>
    </div>
  );
}
