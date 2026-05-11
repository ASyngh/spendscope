"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { AuditTool } from "@/types/audit";
import { runFullAudit } from "@/lib/run-audit";
import { FullAuditResult } from "@/lib/run-audit";
import { AuditForm } from "@/components/audit/audit-form";
import { AuditResults } from "@/components/audit/audit-results";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "spendscope_tools";

function loadTools(): AuditTool[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as AuditTool[];
    } catch {
        return [];
    }
}

function saveTools(tools: AuditTool[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
    } catch {
        // quota exceeded or private browsing — fail silently
    }
}

export default function AuditPage() {
    const [tools, setTools] = useState<AuditTool[]>([]);
    const [result, setResult] = useState<FullAuditResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [auditKey, setAuditKey] = useState(0);

    // Hydrate from localStorage on mount (after hydration to avoid SSR mismatch)
    useEffect(() => {
        setTools(loadTools());
    }, []);

    const updateTools = (next: AuditTool[]) => {
        setTools(next);
        saveTools(next);
    };

    const handleAddTool = (tool: AuditTool) => {
        updateTools([...tools, tool]);
    };

    const handleRemoveTool = (id: string) => {
        updateTools(tools.filter(t => t.id !== id));
    };

    const handleRunAudit = async () => {
        if (tools.length === 0) return;
        setLoading(true);
        try {
            const res = await runFullAudit(tools);
            setAuditKey(k => k + 1);
            setResult(res);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
    };

    return (
        <div className="flex flex-col min-h-[100dvh]">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">AI Spend Audit</h1>
                    <p className="text-muted-foreground">Document your stack. We&apos;ll find the waste.</p>
                </div>

                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AuditForm
                                tools={tools}
                                onAddTool={handleAddTool}
                                onRemoveTool={handleRemoveTool}
                                onRunAudit={handleRunAudit}
                                loading={loading}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AuditResults
                                key={auditKey}
                                result={result}
                                tools={tools}
                                onReset={handleReset}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}