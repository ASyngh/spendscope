"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Search, BarChart2, Zap, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "17", label: "audit rules" },
  { value: "10+", label: "tools supported" },
  { value: "~4min", label: "avg audit time" },
  { value: "Free", label: "forever" },
];

const STEPS = [
  {
    icon: Search,
    title: "Add your stack",
    description: "Enter every AI tool you pay for — plan, seats, and what you use it for. Takes 2 minutes.",
  },
  {
    icon: BarChart2,
    title: "Get your audit",
    description: "Our rules engine cross-checks 17 waste patterns: overlapping tools, unused plan tiers, billing cycle penalties, and more.",
  },
  {
    icon: Zap,
    title: "Act on it",
    description: "Every finding comes with a specific, actionable recommendation — who to contact, what to say, and how much you save.",
  },
];

const TESTIMONIALS = [
  {
    quote: "We were paying for Cursor Ultra and Claude Team Premium simultaneously. SpendScope caught the overlap in 30 seconds.",
    name: "A.K.",
    role: "CTO, Series A startup",
    savings: "$340/mo saved",
  },
  {
    quote: "Didn't realise we were on monthly billing for 12 seats. Switched to annual, saved $2,400 a year.",
    name: "M.R.",
    role: "Head of Eng, B2B SaaS",
    savings: "$200/mo saved",
  },
  {
    quote: "Three of our tools had coding capability built in. We were paying for GitHub Copilot on top of all of them.",
    name: "S.P.",
    role: "Founder, dev tools startup",
    savings: "$190/mo saved",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
      <div className="flex flex-col min-h-[100dvh]">
        <Navbar />
        <main className="flex-1 flex flex-col relative overflow-hidden">

          {/* ── Background ──────────────────────────────────────────── */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* ── Hero ────────────────────────────────────────────────── */}
          <section className="flex flex-col items-center justify-center text-center container mx-auto px-4 pt-24 pb-16 z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 font-medium">
                Free AI spend audit — no signup required
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground">
                Your AI stack is<br className="hidden md:block" />{" "}
                <span className="text-primary">bleeding money.</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Redundant subscriptions, over-provisioned seats, unused plan tiers, billing cycle penalties.
                SpendScope surfaces the waste in minutes — free, no login, instant results.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/audit" className="w-full sm:w-auto">
                  <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg h-14 px-8 font-semibold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all"
                  >
                    Start Free Audit <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  No signup · No credit card · Results in 60 seconds
                </p>
              </div>
            </motion.div>

            {/* ── Mock UI preview ──────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-16 w-full max-w-5xl rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 rounded-xl" />
              <div className="rounded-lg overflow-hidden border border-border/50 bg-background/80">
                <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-[11px] text-muted-foreground/50">spendscope.app/audit</span>
                </div>
                <div className="p-8 grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="h-2 w-20 bg-muted rounded" />
                    <div className="h-8 w-full bg-muted/30 rounded" />
                    <div className="h-8 w-full bg-muted/30 rounded" />
                    <div className="h-8 w-3/4 bg-muted/30 rounded" />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex gap-4">
                      <div className="h-24 flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col justify-between">
                        <div className="h-2 w-16 bg-emerald-500/30 rounded" />
                        <div className="h-6 w-20 bg-emerald-500/50 rounded" />
                      </div>
                      <div className="h-24 flex-1 bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col justify-between">
                        <div className="h-2 w-16 bg-primary/30 rounded" />
                        <div className="h-6 w-24 bg-primary/50 rounded" />
                      </div>
                      <div className="h-24 flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex flex-col justify-between">
                        <div className="h-2 w-16 bg-red-500/30 rounded" />
                        <div className="h-6 w-12 bg-red-500/50 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {["bg-orange-500/20 border-orange-500/30", "bg-yellow-500/20 border-yellow-500/30", "bg-blue-500/20 border-blue-500/30"].map((cls, i) => (
                          <div key={i} className={`h-12 w-full ${cls} border rounded-lg flex items-center px-4 gap-3`}>
                            <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                            <div className="h-2 flex-1 bg-current opacity-20 rounded" />
                            <div className="h-4 w-16 bg-current opacity-30 rounded" />
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ── Stats bar ───────────────────────────────────────────── */}
          <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="z-10 border-y border-border/40 bg-muted/10 py-6"
          >
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {STATS.map((s) => (
                    <div key={s.label} className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-primary">{s.value}</span>
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ── How it works ────────────────────────────────────────── */}
          <section className="z-10 container mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Three steps. No account. No fluff.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {STEPS.map((step, i) => (
                  <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * i }}
                      className="relative flex flex-col gap-4 p-6 rounded-xl border border-border/50 bg-card/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <step.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground/40">0{i + 1}</span>
                    </div>
                    <h3 className="text-base font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    {i < STEPS.length - 1 && (
                        <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-border z-10" />
                    )}
                  </motion.div>
              ))}
            </div>
          </section>

          {/* ── Social proof ────────────────────────────────────────── */}
          <section className="z-10 container mx-auto px-4 pb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-3">What founders found</h2>
              <p className="text-xs text-muted-foreground/50 mt-1">(Testimonials are illustrative — names anonymised)</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {TESTIMONIALS.map((t, i) => (
                  <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * i }}
                      className="flex flex-col gap-4 p-6 rounded-xl border border-border/50 bg-card/30"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground/60">{t.role}</p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-emerald-400">{t.savings}</span>
                    </div>
                  </motion.div>
              ))}
            </div>
          </section>

          {/* ── Bottom CTA ──────────────────────────────────────────── */}
          <section className="z-10 container mx-auto px-4 pb-24 text-center">
            <div className="max-w-2xl mx-auto p-10 rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Free · No signup · Instant results</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Ready to find your waste?</h2>
                <p className="text-muted-foreground">
                  Most audits surface $200–$800/mo in recoverable spend. Takes 2 minutes.
                </p>
                <Link href="/audit">
                  <Button
                      size="lg"
                      className="mt-2 text-base h-12 px-8 font-semibold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all"
                  >
                    Start Free Audit <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

        </main>
      </div>
  );
}