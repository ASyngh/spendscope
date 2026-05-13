# PRICING_DATA.md

Pricing data used in the SpendScope audit engine.

All pricing was verified against official vendor pricing pages during the submission week.

Verified: 2026-05-13

---

## Cursor

- Hobby: Free — https://cursor.com/pricing — verified 2026-05-13
- Pro: $20/user/month — https://cursor.com/pricing — verified 2026-05-13
- Business: $40/user/month — https://cursor.com/pricing — verified 2026-05-13
- Enterprise: Contact sales — https://cursor.com/pricing — verified 2026-05-13

---

## GitHub Copilot

- Individual: $10/user/month — https://github.com/features/copilot/plans — verified 2026-05-13
- Business: $19/user/month — https://github.com/features/copilot/plans — verified 2026-05-13
- Enterprise: $39/user/month — https://github.com/features/copilot/plans — verified 2026-05-13

---

## Claude

- Free: $0 — https://www.anthropic.com/pricing#plans — verified 2026-05-13
- Pro: $20/month — https://www.anthropic.com/pricing#plans — verified 2026-05-13
- Max: $100/month — https://www.anthropic.com/pricing#plans — verified 2026-05-13
- Team: $30/user/month — https://www.anthropic.com/pricing#plans — verified 2026-05-13
- Enterprise: Contact sales — https://www.anthropic.com/pricing#plans — verified 2026-05-13

### Claude API

- Claude Sonnet 4:
    - Input: $3 / million tokens
    - Output: $15 / million tokens
    - https://www.anthropic.com/pricing#api — verified 2026-05-13

---

## ChatGPT / OpenAI

- ChatGPT Plus: $20/month — https://openai.com/chatgpt/pricing — verified 2026-05-13
- ChatGPT Team: $30/user/month — https://openai.com/chatgpt/pricing — verified 2026-05-13
- ChatGPT Enterprise: Contact sales — https://openai.com/chatgpt/pricing — verified 2026-05-13

### OpenAI API

- GPT-4.1:
    - Input: $2 / million tokens
    - Output: $8 / million tokens
    - https://openai.com/api/pricing — verified 2026-05-13

---

## Gemini

- Gemini Advanced (Google One AI Premium): $19.99/month — https://one.google.com/about/ai-premium/ — verified 2026-05-13
- Gemini API pricing:
    - https://ai.google.dev/gemini-api/docs/pricing — verified 2026-05-13

---

## Windsurf

- Free: $0 — https://windsurf.com/pricing — verified 2026-05-13
- Pro: $15/user/month — https://windsurf.com/pricing — verified 2026-05-13
- Teams: $30/user/month — https://windsurf.com/pricing — verified 2026-05-13
- Enterprise: Contact sales — https://windsurf.com/pricing — verified 2026-05-13

---

## Midjourney

- Basic Plan: $10/month — https://www.midjourney.com/account/plans/ — verified 2026-05-13
- Standard Plan: $30/month — https://www.midjourney.com/account/plans/ — verified 2026-05-13
- Pro Plan: $60/month — https://www.midjourney.com/account/plans/ — verified 2026-05-13
- Mega Plan: $120/month — https://www.midjourney.com/account/plans/ — verified 2026-05-13

---

## Jasper

- Creator: $39/user/month — https://www.jasper.ai/pricing — verified 2026-05-13
- Pro: $59/user/month — https://www.jasper.ai/pricing — verified 2026-05-13
- Business: Contact sales — https://www.jasper.ai/pricing — verified 2026-05-13

---

## Grammarly

- Free: $0 — https://www.grammarly.com/plans — verified 2026-05-13
- Premium: $12/user/month — https://www.grammarly.com/plans — verified 2026-05-13
- Business: $15/user/month — https://www.grammarly.com/plans — verified 2026-05-13

---

## Notion AI

- Notion Free: $0 — https://www.notion.so/pricing — verified 2026-05-13
- Plus: $10/user/month — https://www.notion.so/pricing — verified 2026-05-13
- Business: $18/user/month — https://www.notion.so/pricing — verified 2026-05-13
- Notion AI Add-on: Included in newer plans / usage-based features — https://www.notion.so/product/ai — verified 2026-05-13

## Assumptions Used in Audit Logic

Some audit recommendations use heuristic assumptions rather than exact billing calculations.

Examples:
- Teams under 3 users are often overprovisioned on enterprise-style plans
- Multiple overlapping coding assistants (Cursor + Copilot + Claude Team) may indicate redundant spend
- Annual billing recommendations assume standard vendor discounts where applicable
- API usage optimization assumes low-to-mid scale startup usage patterns rather than enterprise-scale workloads

These assumptions are documented in the audit engine and were intentionally heuristic-driven for MVP scope.