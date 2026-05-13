# METRICS.md

# North Star Metric

## Monthly Qualified Savings Opportunities Generated

Definition:
- the total number of audits per month that identify meaningful savings opportunities and result in captured leads.

This metric was chosen because SpendScope is fundamentally:
- a lead-generation product
- a procurement-intelligence funnel
- a Credex acquisition surface

Raw traffic alone is not useful.

The most important signal is:
> “How many startups discovered actionable AI overspend through the product?”

A completed audit without meaningful findings has lower business value than:
- a high-savings audit
- followed by lead capture
- followed by consultation intent.

---

# Input Metrics

## 1. Audit Completion Rate

Definition:
- percentage of landing page visitors who complete the full audit flow.

Why it matters:
- measures onboarding friction
- measures perceived product clarity
- measures whether users trust the form enough to finish it

If this metric drops:
- the landing page messaging is likely unclear
- the form may feel too long
- users may not believe the value proposition

---

## 2. High-Savings Audit Rate

Definition:
- percentage of audits identifying savings above a threshold (example: $500/month).

Why it matters:
- directly affects Credex lead quality
- determines whether the audit engine is surfacing meaningful optimisation opportunities
- impacts conversion potential

Too low:
- recommendations may be overly conservative

Too high:
- recommendations may feel unrealistic or exaggerated

The ideal state is:
- believable but meaningful optimisation opportunities.

---

## 3. Share Rate of Audit URLs

Definition:
- percentage of completed audits whose public report URLs are copied or shared.

Why it matters:
- measures perceived usefulness
- measures virality potential
- indicates whether users find results credible enough to show others

This metric is especially important because SpendScope is designed to grow through:
- screenshots
- founder sharing
- internal team discussions
- public workflow comparisons

---

# First Instrumentation Priorities

The first events I would instrument:

```txt
landing_page_view
audit_started
audit_completed
lead_captured
share_url_clicked
credex_cta_clicked
```

Additional metadata:
- team size
- monthly spend range
- number of tools submitted
- savings bracket

would help segment:
- high-intent startups
- procurement-ready leads
- enterprise-scale opportunities

---

# Important Funnel Metrics

Example funnel:

```txt
Landing Page Visitors
↓
Audit Starts
↓
Audit Completions
↓
Lead Captures
↓
Credex CTA Clicks
↓
Consultations
```

The most critical drop-off point is likely:
```txt
audit_started → audit_completed
```

because the form length directly affects completion rates.

---

# Pivot Trigger

A major pivot would be considered if:

```txt
<5% of completed audits identify meaningful savings
```

OR

```txt
users repeatedly distrust or ignore recommendations
```

This would suggest:
- the pain point is weaker than expected
- AI spend optimisation is not urgent enough
- users do not trust heuristic-based audits
- manual input friction outweighs perceived value

In that scenario, the product would likely need:
- billing integrations
- stronger benchmarking
- API-level analytics
- automated spend ingestion

to create enough differentiation.

---

# Long-Term Metrics Expansion

If SpendScope evolved beyond MVP, additional metrics would include:
- average savings identified per audit
- repeat audit frequency
- consultation-to-conversion rate
- cost savings realised post-conversion
- benchmark engagement
- enterprise procurement pipeline value

The long-term goal would not simply be:
> “more users.”

It would be:
> “more financially actionable AI infrastructure decisions.”