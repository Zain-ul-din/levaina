/**
 * AI judge: was ending with a question (or not) the right call for this reply?
 * Uses the strong model: the small one misread the policy (it failed a reply for asking about
 * something the user hadn't said yet, which is the reason to ask). Its reason is in the case's trace.
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import { model } from "@/lib/ai/models";
import type { CoachTurn, CoachTurnInput } from "./run-coach";

/** The policy we agreed, in the judge's words. */
const POLICY = `A gut-health and weight coach should end with a question only when the answer would change its next advice.

Asking is right when something important is missing (for example whether a new user wants to gain, lose or hold weight before weight advice), or when the message is ambiguous ("I ate the usual", "it happened again").

Not asking is right when:
- the user is just logging (a meal, a weight) and the coach already knows their situation
- the user says thanks, ok, or that they'll try something
- the user is upset or giving up (support, not questions)
- it's a red flag where the only job is getting them to a doctor
- the reply already invites them to come back and say how something went (that invitation is a good ending, not a missed question)

Judge the choice, not the wording: asking about something the coach doesn't know yet is fine when it changes the advice. Two questions joined into one is still asking.

A question here means any question the user is expected to answer, whether or not it is wrapped in <ask> tags.`;

/** Ends with a question the user is expected to answer: an <ask>, or a "?" in the last paragraph. */
export function endsWithQuestion(reply: string): boolean {
  if (reply.includes("<ask>")) return true;
  const paragraphs = reply.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return /\?/.test(paragraphs.at(-1) ?? "");
}

export async function judgeQuestion(input: CoachTurnInput, turn: CoachTurn): Promise<number> {
  const known = [
    input.remembered?.length ? `Remembered: ${input.remembered.map((m) => m.content).join("; ")}` : "Remembered: nothing (a new user)",
    `Log entries before this message: ${input.logs?.length ?? 0}`,
  ].join("\n");
  const { output } = await generateText({
    model,
    providerOptions: { mistral: { reasoningEffort: "low" as const } },
    output: Output.object({
      schema: z.object({
        reason: z.string().describe("One short sentence: why asking or not asking was right or wrong here."),
        right: z.boolean().describe("True if the reply's choice to end with a question, or not, follows the policy."),
      }),
    }),
    prompt: `${POLICY}\n\n# What the coach knew\n${known}\n\n# The user said\n${input.message}\n\n# The coach replied\n${turn.reply}\n\nThe reply ${endsWithQuestion(turn.reply) ? "ends with a question" : "does not end with a question"}. Was that the right call?`,
  });
  return Number(output.right);
}
