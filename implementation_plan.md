# UnSub Hero — Marketing & Onboarding Revamp

## Overview

The client has requested 5 specific changes to the landing page's marketing and onboarding flow. Below is a structured breakdown of what needs to be done, file by file, before any code is written.

---

## Proposed Changes — Summary Table

| # | Client Request | What We'll Do | Files Affected |
|---|---|---|---|
| **1** | Simplify to Personal (left) + Business (right) split | Below the existing headline and copy-email CTA, we'll add a two-card split: **Personal** on the left with tagline *"Declutter your inbox, no login required"* and **Business** on the right with tagline *"Spare your colleague's inbox."* Clicking either card navigates to its dedicated page. | `Hero.tsx` |
| **2** | Personal click → dedicated page | Create a new `/personal` page. Content: (a) A punchy "Why the iPhone unsubscribe feature fails" section with real reasons (links to spam folder, not truly blocked, only works on iOS, etc.), followed by (b) the UnSub Hero value prop — no login, just forward and forget. Includes the copyable email address prominently. | `frontend/src/app/personal/page.tsx` (NEW) |
| **3** | Business click → dedicated page | Create a new `/business` page. Content: explains that by signing up with a company domain, **every colleague with that domain** automatically gets unsubscription access — no individual setup. Highlights team inbox hygiene and admin-free management. | `frontend/src/app/business/page.tsx` (NEW) |

---

## Detailed Breakdown Per Step

### Step 1 — Personal / Business Split Cards (`Hero.tsx`)
- Below the headline + email CTA, add a horizontal two-card row
- **Personal card (left):**
  - Label: `Personal`
  - Tagline: *"Declutter your inbox, no login required"*
  - Arrow/chevron indicator → links to `/personal`
- **Business card (right):**
  - Label: `Business`
  - Tagline: *"Spare your colleague's inbox"*
  - Arrow/chevron indicator → links to `/business`
- Cards: minimal, dark-glass style with subtle border, hover lift animation. Fits the existing aesthetic.

---

### Step 2 — Personal Page (`/personal`) (NEW FILE)
Structure:
1. **Hero section** — headline: *"Your iPhone's unsubscribe button isn't actually working."* Subtext: *"Here's what's really happening — and what actually fixes it."*
2. **Problem section** — 3–4 illustrated cards:
   - *"It sends you to spam — not away"* — iPhone's 'Unsubscribe' moves the sender to spam, but they can still email you. You're not removed from their list.
   - *"It only works on Apple devices"* — Android, web, Windows users get nothing.
   - *"It requires per-email manual action"* — You have to do it one email at a time, every time.
   - *"The sender still has your address"* — Your email is in their list. It'll be sold, leaked, or re-activated.
3. **Solution section** — *"UnSub Hero actually works."*
   - No login required — just forward the email
   - Permanent sender blocking via automated unsubscription
   - Copyable email address chip (same as hero)
4. **CTA** — large copyable email

---

### Step 3 — Business Page (`/business`) (NEW FILE)
Structure:
1. **Hero section** — headline: *"One tool. Every inbox at your company."*
   - Subtext: *"When you sign up with your company domain, every colleague with that domain automatically gets access."*
2. **How it works** — 3-step flow:
   - *"Admin registers the domain"* — e.g. `@acme.com`
   - *"Every @acme.com email address is enrolled"* — no per-user setup
   - *"Each person forwards → sender is blocked"* — instantly, silently
3. **Benefits** — cards:
   - No IT overhead — zero per-user configuration
   - Keeps shared inboxes clean (support@, info@, etc.)
   - Protects the whole company from newsletter spam
4. **CTA** — *"Register your domain"* → links to `/sign-in`

---

## Verification Plan

| Check | How |
|---|---|
| Personal/Business cards clickable | Navigate to `/personal` and `/business` |
| Personal page renders correctly | Review all 4 problem cards + solution section |
| Business page renders correctly | Review domain flow + 3-step breakdown |
| Responsive layout | Test at 375px, 768px, 1440px widths |

---

> [!IMPORTANT]
> The `/personal` and `/business` pages will be **new standalone pages** — they are not modals or overlays. They will have the same `Navbar` but their own distinct layouts, no `TemplateOverlay` dependency needed.

> [!NOTE]
> The 3D card grid at the bottom of `Hero.tsx` is left untouched — it's below the fold and the client did not ask for its removal.
