# Evals

How the coach is tested. Run these before and after any change to the coach's instructions,
tools or model, and compare the runs in Laminar. Words like golden case, tier and judge are
defined in `GLOSSARY.md`.

## Running them

```bash
npx lmnr eval evals/golden.eval.ts                       # the main one
GOLDEN_ONLY=easy-thanks,extreme-blood npx lmnr eval evals/golden.eval.ts   # just some cases
npx lmnr eval evals/reply-quality.eval.ts                # replies to score by hand
```

Needs `MISTRAL_API_KEY` and `LMNR_PROJECT_API_KEY` in `.env` (an `EXA_API_KEY` turns on the
research cases). Each eval prints a Laminar link; every case is a trace you can open.

Costs are Mistral usage: about $0.006 per coach turn. The golden eval with 3 trials is about
96 turns plus the judge, roughly $0.90; a single trial is about $0.25.

## The evals

| Eval | What it checks | Scored by |
|---|---|---|
| `golden.eval.ts` | The answer key: 32 golden cases across six tiers (easy, medium, hard, extreme, research, ambiguous), 3 trials each | Rules, plus one AI judge |
| `reply-quality.eval.ts` | How replies feel: 11 golden cases and 4 experience cases with real history | People, with the rubric |
| `tool-calling.eval.ts` | Logging basics: entries, times, safety, one question | Rules, plus a small reply judge |
| `coach-memory.eval.ts` | Lasting facts said in passing get remembered (the homemade protein powder) | Rules |

### Golden eval scores

- **pass**: every rule the case sets passed. The headline number.
- **rules**: each rule on its own, only for cases that set it: `rightEntries`, `rightDates`,
  `rightTimes`, `rightCorrection`, `rightMemory`, `safetyNote`, `doctorFirst`, `asksRight`,
  `searchedRight`, `noPersonalDetails`, `citesSource`.
- **questionRate**: share of replies ending with a question. Lower is calmer; the ambiguous
  cases keep it from dropping to zero.
- **questionJudgement**: AI judge on every case: was asking, or not asking, the right call?
  Its one-line reason is in the case's trace.
- **validCalls**: every tool call was valid the first time (no retry round trip).
- **inputTokens**: context size, charted run over run.

Filter or group by `metadata.tier` in Laminar to see where the coach struggles.

## Scoring by hand

Laminar's UI can't take human scores, so replies are scored on a separate page and the scores are
written back to the evaluation through the API (`LaminarClient.evals.updateDatapoint`).

The rubric is pass, fail or not applicable on each of:

| Quality | Passes when |
|---|---|
| Empathy and care | The opening line meets them where they are, and lifts them when they're struggling |
| Warm and light | Calm like a friend; never alarming, heavy or preachy, even with serious news |
| Specific | Uses their foods, history and goal |
| Accurate | No wrong facts (white rice is not a fibre source) |
| Shows progress | Shows something they couldn't see: a pattern, or how far they've come |
| One next step | One small thing for today, not a list |
| Reason to come back | A light invitation to return and say how it went |

Score blind: whoever scores second seals their scores first (save them and share the file's
SHA-256 fingerprint), so neither drifts toward the other.

## Working rules

- **Read the trace before trusting a score.** A score that jumps can be the coach, the
  expectation, or the eval itself; all three have happened here.
- **A judge has to earn its place.** Read its reasons on the cases it fails; the small model
  reasoned backwards on about half, so it now runs on the strong one.
- **Allow every right answer.** A golden case can accept more than one behaviour (an entry
  count can be `[0, 1]`).
- **Change one thing, then re-run.** Instruction edits are measured by their effect on the same
  frozen cases, including how many tokens they add.
