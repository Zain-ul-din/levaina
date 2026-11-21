# Brand guide

How the app looks and sounds. The source of truth for colours is `app/globals.css`, and for the logo it is `lib/brand/logo-geometry.ts`; this page explains how to use them.

**Name:** **Levaina** (*leh-VAY-nah*). App Store title: *Levaina: Gut & Weight Coach*. Defined once in `lib/brand/brand.ts`.

From French *levain*: the living sourdough culture you feed every day, which ferments and makes bread rise. Your gut flora is a living culture you feed too, and the goal is to rise: gain weight and feel better. The name pairs with the Morning Bowl logo (a sun rising out of a bowl). In copy, the product is "Levaina"; the character inside it is "the coach".

## The idea

A warm kitchen table, not a clinic. People open this app anxious about food, so everything should feel calm, edible and kind. The logo says it: **a sun rising out of a bowl**, a new day and a warm meal.

## Logo: Morning Bowl

| Variant | Use at | Component |
|---|---|---|
| Full (bowl, sun, rays) | 24px and up: header, splash, App Store | `<LogoMark variant="full" />` |
| Small (no rays) | Under 24px: favicon, tiny badges | `<LogoMark variant="small" />` |

- Colour: matcha on oat (light), light matcha on night (dark). In the UI, set it with `text-primary`; the mark follows `currentColor`.
- Clear space: keep at least half the mark's width empty around it.
- Wordmark: the mark, then the name in Fraunces semibold, with a gap of about a quarter of the mark's width.
- Don't: recolour the sun differently from the bowl, add outlines or shadows, stretch it, or put it on a busy photo.
- The app icon is generated from the geometry (`app/icon.tsx`, `app/apple-icon.tsx`). Change the shapes there, never in exported images.

## Colour: Miso & Matcha

| Role | Light | Dark | Token |
|---|---|---|---|
| Page | `#f3f0e7` oat | `#191814` charcoal-olive | `--background` |
| Cards, bubbles, composer | `#fffdf7` | `#23211b` | `--card` |
| Ink (text) | `#2b2620` charcoal-brown | `#efebe1` rice-paper | `--foreground` |
| Secondary text | `#7e776b` | `#a49d8f` | `--muted-foreground` |
| Actions (send, toggles) | `#5e7a2e` matcha | `#a9c46e` light matcha | `--primary` |
| "Saved" tag | `#e6edd5` / `#4f6a22` | `#2b3320` / `#c4da98` | `--saved` |

Rules:
- Ink is never pure black. Text on the page is charcoal-brown.
- Matcha marks things you can **do**. Don't use it for decoration.
- Food colours (`--chart-*`: protein orange, carb lime, fat yellow) appear only where they mean food, in charts and trackers.
- No gradients, glows or textures.
- Elevation is one token, `shadow-soft`: short and tight (about 2–4px reach). Never add large blurry shadows; they also get clipped inside the chat list.

## Type

| Use | Font | Style |
|---|---|---|
| Headlines, wordmark, sheet titles | Fraunces (Google Fonts, OFL) | Semibold, title or sentence case, tight tracking |
| Everything else | Satoshi (Fontshare, self-hosted in `app/fonts`) | 16px body, 17px coach replies (line-height 1.65) |

- Sentence case everywhere in the UI. No all-caps labels.
- No monospace in the UI.

## Voice and tone

The coach sounds like a calm friend who knows nutrition, not a doctor and not a cheerleader.

| We are | We are not |
|---|---|
| Warm and plain-spoken | Clinical or full of jargon |
| Honest about uncertainty | Overpromising ("heal your gut in 7 days") |
| Specific ("about 2,500 kcal a day") | Vague ("eat more healthy food") |
| Calm about bodies (stool, gas, bloating are normal topics) | Squeamish, jokey or shaming |

**UI copy rules**
- Say what happens: buttons are verbs ("Send", "Undo", "Try again"), and the result echoes them ("Saved", "Removed").
- Errors say what went wrong and what to do next, without apologising: *"The reply didn't arrive. Check your connection and try again."*
- Empty states invite an action: *"Tell the coach about your symptoms, diagnosis or goals."*
- Talk to the person as "you"; the coach is "I" only inside replies.
- Medical caution appears where it matters, briefly: *"Not medical advice. Check big changes with your doctor."* Don't repeat it in every message.
- Emoji label food and topics (🥩 🫧 ⚖️ 💊) at the start of a line. Never more than one per item, and never in the coach's medical explanations.

**Words**

| Use | Avoid |
|---|---|
| Memory, remember, forget | Data, profile, delete |
| Plan | Protocol, regimen, programme |
| Bloating, loose stools, constipation | Clinical euphemisms or slang |
| Gain weight, reach your goal | Bulk, cut, "fix" your body |
