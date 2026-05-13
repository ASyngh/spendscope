# USER_INTERVIEWS.md — SpendScope

Three conversations with real users from my college network and personal contacts.
Conducted over DM/voice between May 12–13, 2026. Each ran 10–15 minutes.

---

## Interview 1 — Ayush Kar, Medibolize
**Role:** Founder  
**Company stage:** Early, solo-run, <₹5L revenue  
**Date:** May 13, 2026

### Stack at time of interview
Claude Pro, Cursor Pro, ChatGPT (free tier), Midjourney Standard — 4 to 6 subscriptions
at any given time depending on what he's trialling.

### Conversation

**Which AI tools do you currently use most?**

"Claude Pro and Cursor Pro are my daily drivers. I use ChatGPT since it's been free since last year, when I want a different take on something, and Midjourney Standard for visuals when I need something quick."

**Have you ever felt you were paying for overlapping tools?**

"Oh absolutely. For about 3 months I was paying for both GitHub Copilot and Cursor Pro at the same time. Both doing basically the same autocomplete inside my editor. I just forgot to cancel one."

**What usually decides whether you keep or cancel?**

"How often I actually open it. If I haven't touched something in two weeks, it's gone. But I'm not always that disciplined — sometimes I cancel things I actually needed."

**Would a tool showing wasted AI spend be useful?**

"Very useful. I don't have a finance team, it's just me staring at my GooglePay autopay going 'what's this $20 charge again?'"

**What would make you trust SpendScope with your spending data?**

"I'd want it to connect only to my billing — read-only, nothing more. No storing card details. And I should be able to see exactly what data you have on me and delete it whenever I want. Something like a simple, clear privacy page, not a wall of legal text."

**Any specific features you'd expect?**

"A 'you haven't used this in 30 days' nudge would be gold. And maybe an overlap detector — like 'Claude Pro and ChatGPT Plus are covering the same ground for you, here's what you could cut.'"

### Most surprising thing he said
He rated his own expense tracking a **3 out of 10** — he knew roughly what he was spending but couldn't give an exact number on the spot. For someone actively running a startup, that gap was bigger than expected.

### What it changed
Added the "you're spending well" banner with a notify-me flow for stacks that are already optimised — Ayush's use case (deliberate tool separation, low waste) would have gotten a near-empty results page without it. The banner needed to feel useful, not dismissive.

---

## Interview 2 — Z.N., InAmigos
**Role:** Operations / Strategy  
**Company stage:** Early-stage, team of ~15  
**Date:** May 13, 2026

### Stack at time of interview
Claude Pro (3 team seats), ChatGPT Plus (2 team seats), Gemini (bundled via Google Workspace),
Cursor Pro (personal).

### Conversation

**What's currently in your must-have AI toolkit?**

"Claude Pro for anything writing or strategy related. Gemini because we're on Google Workspace so it's basically already there. And I've been using Cursor even though I'm not a developer — helps me prototype faster than waiting on the eng team."

**Do you run into issues with redundant features across your subscriptions?**

"Yes, and it wasn't even my own money which somehow made it worse. We had three people with separate Claude Pro subscriptions, two on ChatGPT Plus, out of a team of just 15. All of them going in the company budget."

**What's the main factor in your keep-or-kill decision?**

"For me personally, whether it's saving me more time than it costs. For company tools it's more political — whoever bought it has to admit it's not working, which always takes longer than it should."

**Is there a gap in the market for a wasted spend dashboard?**

"Extremely useful, especially at the team level. Although we haven't too much of a team right now but I can see it being useful for sure."

**What does a tool need to do to earn your trust regarding data?**

"Some kind of security certification would go a long way. And I'd want it connected only to billing information, not deeper into our accounts."

**Any killer features you'd want to see?**

"Team-level dashboards for sure. Alerts when nobody on the team has used a subscription in X days. And a clean monthly summary to keep track of at the end of the month."

### Most surprising thing they said
The "political" friction around cancelling company tools — the person who bought it has to admit it isn't working. That's a blocker that has nothing to do with the tool's actual value and everything to do with organisational dynamics. A pure cost-savings framing doesn't solve that.

### What it changed
Framing recommendations as data-driven ("here's the usage evidence") rather than just opinion-based ("this tool is redundant") matters more for team contexts. Influenced the CFO-tone in Groq enrichment — recommendations are phrased as business cases, not personal suggestions.

---

## Interview 3 — Ankur Singh, Creative Technologist
**Role:** Independent / Freelance  
**Company stage:** Solo, client work  
**Date:** May 13, 2026

### Stack at time of interview
Claude Max, ChatGPT Plus, Cursor Pro, Midjourney Standard — 3 to 5 subscriptions
depending on active client projects.

### Conversation

**Which AI apps are you leaning on most right now?**

"Claude Max and ChatGPT Plus are non-negotiable. Cursor Pro for any code work. And I keep a Midjourney Standard subscription for client decks even though I realistically use it maybe twice a month."

**Have you noticed a lot of feature overlap in your stack?**

"More than I'd like to admit. Worst period was when I had ChatGPT Plus and Claude Pro running simultaneously. Both can search the web, write long-form, summarize documents. I was basically paying two times for the same thing for about three months before I actually sat down and compared them."

**How do you decide which subscriptions to prune?**

"Whether it's actually in my muscle memory. If I have to consciously remember a tool exists, it's not earning its cost. The ones that last are the ones I go for without thinking."

**Would you actually pay attention to a tool showing you wasted money?**

"Moderately to very useful. I've gotten better at tracking this myself but it's still manual effort. If something automated it I'd use it for sure without hesitation."

**What are your non-negotiables for security and privacy?**

"I'd want it connecting only to billing emails or subscription management, not my full bank account."

**What would make the tool truly actionable for you?**

"Something like — 'you're spending X on writing tools, Y on coding tools.' And a consolidation suggestion, not just 'you're wasting money' but 'here's which one you could drop and why.' That's actually actionable."

### Most surprising thing he said
The "muscle memory" heuristic — if he has to consciously remember a tool exists, it's already failing. That's a sharper mental model than any usage-hours metric and it reframes what "active use" actually means.

### What it changed
Recommendation cards now lead with the specific action ("drop X, keep Y, here's why") rather than just flagging the problem. The distinction between identifying waste and telling you exactly what to do about it became a core design principle after this conversation.