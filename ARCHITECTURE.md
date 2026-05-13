# ARCHITECTURE.md — SpendScope

## System Overview

SpendScope is a Next.js 15 App Router application. The audit runs client-side (deterministic rule engine) with an async Groq enrichment step server-side. Results are persisted to Supabase for shareable URLs. Lead capture triggers a Resend transactional email.

---

## Mermaid Diagram

```mermaid
flowchart TD
    User["User (Browser)"] -->|Fills audit form| AuditPage["app/audit/page.tsx"]
    AuditPage -->|runAudit(tools)| Engine["lib/audit-engine.ts\n17 deterministic rules"]
    Engine -->|AuditResult| AuditPage
    AuditPage -->|POST /api/enrich| EnrichAPI["app/api/enrich/route.ts"]
    EnrichAPI -->|Prompt + tool data| Groq["Groq API\nllama-3.3-70b-versatile"]
    Groq -->|CFO-tone suggestions| EnrichAPI
    EnrichAPI -->|Enriched recommendations| AuditPage
    AuditPage -->|POST /api/audit/save| SaveAPI["app/api/audit/save/route.ts"]
    SaveAPI -->|INSERT audits row| Supabase[("Supabase\naudits table")]
    Supabase -->|audit.id| SaveAPI
    SaveAPI -->|/audit/id| AuditPage
    AuditPage -->|Renders results| Dashboard["Results Dashboard\nSavings summary, rec cards,\nspend breakdown chart"]
    Dashboard -->|>$500/mo savings CTA| LeadForm["Lead Capture Form"]
    LeadForm -->|POST /api/leads| LeadsAPI["app/api/leads/route.ts"]
    LeadsAPI -->|INSERT leads row| Supabase
    LeadsAPI -->|Send confirmation| Resend["Resend API"]
    ShareURL["app/audit/[id]/page.tsx"] -->|GET audit by id| Supabase
    Supabase -->|audit row| ShareURL
```

---

## Data Flow

### 1. Audit submission
1. User fills the audit form (tool name, plan, seats, monthly cost, use case, billing cycle)
2. `runAudit(tools)` runs synchronously in the browser — pure TypeScript, no network call
3. Result (`AuditResult`) is stored in React state and `localStorage`
4. Simultaneously, `POST /api/enrich` sends tool data to Groq for semantic enrichment
5. Groq returns CFO-tone suggestion text; enriched recommendations replace the base ones in state
6. `POST /api/audit/save` persists the full result to Supabase `audits` table, returns the row `id`
7. URL updates to `/audit/[id]` — shareable from this point

### 2. Lead capture (>$500/mo savings)
1. User submits name, email, company, role, team size via the Credex CTA form
2. Honeypot field checked server-side — bots bail here
3. `POST /api/leads` inserts a row to Supabase `leads` table with audit metadata
4. Resend sends a transactional confirmation email to the user

### 3. Shareable URL load
1. `/audit/[id]` fetches the audit row from Supabase by ID
2. Full `AuditResult` is hydrated from the `tools`, `recommendations`, and savings fields
3. Page renders identically to the original results dashboard

---

## Database Schema

### `audits`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, used in shareable URL |
| `tools` | jsonb | Array of `AuditTool` objects |
| `recommendations` | jsonb | Array of `Recommendation` objects |
| `total_monthly_spend` | numeric | Sum of all tool costs |
| `potential_monthly_savings` | numeric | Sum of all non-upgrade rec savings |
| `potential_yearly_savings` | numeric | `potential_monthly_savings × 12` |
| `stack_is_well_optimised` | boolean | Drives SpendingWellBanner |
| `optimisation_notes` | text | Groq-generated summary |
| `created_at` | timestamptz | Auto-set by Supabase |

### `leads`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `email` | text | User email for follow-up |
| `company_name` | text | |
| `role` | text | |
| `team_size` | text | |
| `estimated_monthly_savings` | numeric | From audit result |
| `total_monthly_spend` | numeric | From audit result |
| `audit_summary` | text | Short text summary of findings |
| `created_at` | timestamptz | Auto-set by Supabase |

---

## Stack Justification

| Choice | Reason |
|---|---|
| **Next.js 15 App Router** | Server components + API routes in one repo, no separate backend needed. Edge-ready for Vercel deployment. |
| **TypeScript** | Audit engine operates on financial data — type safety on `AuditTool` and `Recommendation` prevents silent bugs at rule boundaries. |
| **TailwindCSS + shadcn/ui** | shadcn gives accessible, unstyled-by-default components; Tailwind keeps styling co-located with markup. No CSS files to maintain. |
| **Groq (llama-3.3-70b-versatile)** | ~600–800ms median response vs ~2s+ for GPT-4o. For enrichment that runs after the deterministic audit, latency directly affects perceived responsiveness. |
| **Supabase** | Postgres with a REST API, auth, and RLS out of the box. Anon key + RLS policies means no backend auth layer needed for read operations. |
| **Resend** | Transactional email with a clean React Email-compatible API. 100 emails/day free tier is sufficient for lead capture at this stage. |
| **Vercel** | Zero-config Next.js deployment, edge CDN, preview URLs per PR. |
| **Vitest** | Native ESM support, compatible with Next.js + `tsconfig-paths`. Jest requires additional transform config for App Router projects. |

---

## 10,000 User Scale Plan

Current architecture handles low hundreds of concurrent users without changes. At 10k users the following become bottlenecks:

### Groq enrichment latency
**Problem:** Each audit hits Groq synchronously. At scale, Groq rate limits become a queue.  
**Fix:** Move enrichment to a background job (Vercel Queue or Inngest). Return base audit results immediately, stream enrichment in when ready. Users see instant results; enrichment appears progressively.

### Supabase connection pooling
**Problem:** Supabase free/pro tier has a connection limit. Serverless functions each open a connection.  
**Fix:** Add PgBouncer (built into Supabase connection string with `?pgbouncer=true`) or switch to Supabase's `@supabase/supabase-js` pooled client. Zero code change, config-only fix.

### Audit engine stays client-side
The deterministic rule engine is pure TypeScript with no I/O — it scales infinitely client-side. No change needed here.

### Lead capture email
**Problem:** Resend free tier caps at 100 emails/day.  
**Fix:** Upgrade to Resend Pro ($20/mo) at ~3k leads/month. No code change.

### Shareable URL cold reads
**Problem:** `/audit/[id]` fetches from Supabase on every load.  
**Fix:** Add `revalidate` caching on the route — audit results are immutable after creation, so `revalidate: false` (permanent cache) is safe. Vercel edge cache handles repeat loads.

### Monitoring
Add Vercel Analytics + Sentry error tracking before 10k. Current setup has no observability beyond Vercel function logs.