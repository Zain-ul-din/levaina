import type { ResearchSearch } from "@/lib/research/exa-search";
import { tool } from "ai";
import { z } from "zod";

type ResearchToolsOptions = {
  /** Injected so evals can use a fake; production passes the Exa search. */
  search: ResearchSearch;
};

/**
 * Looking up research. Results come only from trusted research and health sites (see
 * RESEARCH_DOMAINS), so the coach can cite a study instead of answering from memory.
 */
export function createResearchTools({ search }: ResearchToolsOptions) {
  return {
    searchResearch: tool({
      description:
        "Search medical research and public-health sources (PubMed, Cochrane, NHS, NIH, WHO and major journals). " +
        "Use it only when the user asks about a study, a treatment or supplement claim, or something that may be newer " +
        "than you know; not for routine advice. Write the query as a general topic in English with no personal details " +
        "(\"psyllium fibre IBS bloating randomised trial\", never their name, weight or story).",
      inputSchema: z.object({
        query: z.string().trim().min(3).max(200).describe("A general research topic, no personal details."),
      }),
      execute: async ({ query }) => {
        try {
          return { results: await search(query) };
        } catch (error) {
          console.error("[searchResearch]", error);
          return { error: "Search is unavailable right now." };
        }
      },
    }),
  };
}

export type ResearchTools = ReturnType<typeof createResearchTools>;
