"use client";

import { useState } from "react";
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
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    description:
      "At-a-glance stats for daily calories, water intake, and macro distribution with beautiful glassmorphism UI.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: Brain,
    title: "AI Food Analyzer",
    description:
      "Upload a photo or describe your meal — our Ernie 5.0 AI instantly calculates nutrition, macros, and health insights.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: Utensils,
    title: "Intelligent Meal Planner",
    description:
      "Generate personalized 7-day meal plans tailored to your dietary restrictions, goals, and preferences.",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  {
    icon: MessageSquare,
    title: "Smart Nutrition Chatbot",
    description:
      "Chat with an AI nutritionist that knows your profile. Bilingual support for English and Mandarin Chinese.",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    icon: BarChart3,
    title: "Daily Summaries & Reports",
    description:
      "Visualize 7-day, 30-day, or all-time trends with interactive charts and an AI-calculated Diet Quality Score.",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    icon: UserCircle,
    title: "Personalized Profile",
    description:
      "Set custom calorie, macro, and water goals. Manage dietary restrictions and switch between Light/Dark themes.",
    color: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
];

const highlights = [
  "Powered by Baidu Ernie 5.0 Thinking LLM",
  "Image & text-based food recognition",
  "Bilingual (EN / 中文) interface",
  "Secure OAuth — no passwords needed",
];

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
        options: {
          redirectTo: getRedirectUrl(),
          skipBrowserRedirect: false,
        },
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
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-2.5">
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
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <div className="hidden sm:flex items-center gap-2">
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
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Background blobs */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-40 -left-32 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-40 -right-32 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, #34d399 0%, transparent 70%)",
          }}
        />

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Baidu Ernie 5.0 Thinking
        </div>

        {/* Headline */}
        <h1 className="relative text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl">
          Eat Smarter,{" "}
          <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-violet-500 to-emerald-500">
            Live Better
          </span>
        </h1>
        <p className="relative mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Your AI-powered nutrition companion. Track meals, analyze food with a
          photo, plan your week, and chat with a smart nutritionist — all in one
          beautifully designed app.
        </p>

        {/* Highlights */}
        <ul className="relative mt-8 flex flex-wrap justify-center gap-4">
          {highlights.map((h) => (
            <li
              key={h}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        {error && (
          <div className="relative mt-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </section>

      {/* ── Stats Banner ── */}
      <section className="px-6 py-10 border-y border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "6+", label: "Core Features" },
            { value: "AI", label: "Ernie 5.0 LLM" },
            { value: "2", label: "Languages Supported" },
            { value: "∞", label: "Meal Combinations" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-primary to-violet-500">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-emerald-500">
                eat well
              </span>
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              A complete nutrition toolkit built around AI, so every meal
              decision is informed and intentional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`group relative p-6 rounded-2xl border ${feat.border} ${feat.bg} hover:scale-[1.02] transition-transform duration-300 cursor-default`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl bg-linear-to-br ${feat.color} flex items-center justify-center mb-4 shadow-md`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Water Tracking Callout ── */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-500/20 via-blue-500/10 to-background border border-sky-500/20 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, #38bdf8 0%, transparent 60%)",
              }}
            />
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Droplets className="h-8 w-8 text-sky-400" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Hydration Tracking Built-In
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                Effortlessly log your daily water intake with one-tap controls.
                Eat Smart AI reminds you to stay hydrated so you never miss your
                daily water goal.
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <Button
                onClick={() => handleOAuthLogin("google")}
                disabled={loading !== null}
                className="rounded-full px-6 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-all"
              >
                Try It Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to transform{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-violet-500 to-emerald-500">
              the way you eat?
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join Eat Smart AI today — completely free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Image
                src="/Logo.png"
                alt="Eat Smart AI"
                width={14}
                height={14}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-foreground">Eat Smart AI</span>
          </div>
          <p>
            For educational purposes only — not a substitute for medical advice.
          </p>
          <a
            href="https://github.com/Aiyern30/nutrition-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
