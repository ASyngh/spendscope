"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Landing() {
  return (
      <div className="flex flex-col min-h-[100dvh]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

          <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 font-medium">
                Identify waste. Optimize ROI.
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground font-sans">
                Audit your AI stack.<br className="hidden md:block" /> Cut unnecessary spend.
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-serif">
                You are bleeding money on redundant AI subscriptions, over-provisioned seats, and unused tools. SpendScope surfaces the waste you didn&apos;t know existed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/audit" className="w-full sm:w-auto">
                  <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg h-14 px-8 font-semibold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all"
                  >
                    Start Free Audit
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-20 w-full max-w-5xl rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 rounded-xl" />
              <div className="rounded-lg overflow-hidden border border-border/50 bg-background/80">
                <div className="h-10 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-chart-4/80" />
                  <div className="w-3 h-3 rounded-full bg-chart-3/80" />
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
                      <div className="h-24 flex-1 bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col justify-end">
                        <div className="h-6 w-1/2 bg-primary/40 rounded" />
                      </div>
                      <div className="h-24 flex-1 bg-muted/30 rounded-lg p-4 flex flex-col justify-end">
                        <div className="h-4 w-1/2 bg-muted rounded mb-2" />
                        <div className="h-6 w-1/3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-32 w-full bg-muted/30 rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
  );
}
