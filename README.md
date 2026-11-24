# Levaina

An AI coach for people with gut issues who also need to gain, lose or hold their weight.

Most diet apps count calories and most gut apps track symptoms. Levaina does both in one conversation: tell it what you ate and how you felt, and it remembers, logs it for you, and builds a plan around what your gut actually tolerates.

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/sign-in.webp" width="200" alt="Sign-in screen with a sunrise behind a frosted glass card" /><br /><sub>Sign in with a code</sub></td>
    <td align="center"><img src="docs/screenshots/home.webp" width="200" alt="Home screen with starter questions" /><br /><sub>Start a conversation</sub></td>
    <td align="center"><img src="docs/screenshots/conversation.webp" width="200" alt="The coach answering a question about gaining weight" /><br /><sub>A plan that fits your gut</sub></td>
    <td align="center"><img src="docs/screenshots/log.webp" width="200" alt="Quick log sheet with today's meals, symptoms and weight" /><br /><sub>Log in a tap</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/meal.webp" width="200" alt="Meal form" /><br /><sub>Meals, symptoms, stool, weight</sub></td>
    <td align="center"><img src="docs/screenshots/memories.webp" width="200" alt="What the coach remembers, in dark mode" /><br /><sub>See what it remembers</sub></td>
    <td align="center"><img src="docs/screenshots/chats.webp" width="200" alt="Past chats, in dark mode" /><br /><sub>Pick up where you left off</sub></td>
    <td align="center"><img src="docs/screenshots/history.webp" width="200" alt="Full log grouped by day, in dark mode" /><br /><sub>Your whole log</sub></td>
  </tr>
</table>

## What it does

- **Coaches with care.** Every reply starts with how you're feeling, gives one small thing to try today, and invites you back to say how it went. It only asks a question when the answer would change its advice.
- **Logs as you talk.** Say "had dal and rice, bloated an hour later" and the coach records the meal and the symptom. Or tap to log meals, symptoms, stool and weight yourself.
- **Remembers what matters.** Conditions, doctor's advice, food reactions and goals carry over to every conversation. You can see all of it, and remove anything that's wrong.
- **Reads your log.** The coach looks at your recent days to connect what you ate with how you felt.
- **Checks the research.** Ask whether a supplement or a new study holds up, and the coach looks it up on trusted medical sources and tells you where the answer comes from.
- **Calm about serious things.** Warning signs like blood in the stool get clear advice to see a doctor, said gently, never alarmingly.
- **No passwords.** Sign in with a 6-digit code sent to your email.
- **Feels calm.** Light and dark themes, soft motion, sheets you can swipe away, and full respect for reduced-motion settings.

## How it's built

- **Next.js 16** (App Router) and **React 19**, written in TypeScript
- **Vercel AI SDK** streaming replies from **Mistral Large**, with tool calls for logging, memory and research
- **Exa** for research lookups, limited to medical research and public-health sites
- **Laminar** for tracing every model call and running evals
- **Supabase**: Postgres with row-level security on every table, and email-code auth
- **Tailwind CSS v4** and **Base UI**, with Phosphor icons

Some choices worth a look:

- **The model can't quietly skip a field.** Tool inputs are required-but-nullable, so "not mentioned" has to be said on purpose, and a guard stops the same entry being saved twice in one reply.
- **Memory keeps its history.** Facts and dated episodes are kept apart, and a corrected fact is marked as replaced rather than overwritten.
- **Every user's data is walled off in the database itself**, not only in the app.
- **The interface is measured, not eyeballed.** Contrast, alignment, tap targets and motion are checked in a real browser across phone and desktop, light and dark.
- **The coach is tested like code.** A golden set of real situations, from "had dal at 1" to blood in the stool, sorted by difficulty, is run against the coach whenever its instructions change, three times each because models vary.
- **People define "good", then machines check it.** Replies are scored by hand for care, tone and accuracy first. An AI judge takes over a check only after its verdicts and reasons hold up against those human scores.
- **Research can't leak or wander.** Searches only reach trusted medical sites, and queries never include anything personal, such as your weight or your story.

## Run it locally

You'll need Node, pnpm, Docker (for local Supabase) and a Mistral API key.

```bash
pnpm install
supabase start
pnpm dev
```

Set your Mistral API key and the local Supabase URL and keys as environment variables, then open http://localhost:3000. Sign-in codes arrive in the local Supabase mail inbox.

Two keys are optional: an Exa key turns on research lookups, and a Laminar project key turns on tracing and lets you run the evals with `npx lmnr eval`.

---

Levaina gives general wellness guidance, not medical advice. Check big changes with your doctor.
