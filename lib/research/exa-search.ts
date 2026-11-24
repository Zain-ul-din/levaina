import Exa from "exa-js";

/**
 * Where the coach may look things up: research databases and public-health bodies only, never
 * blogs, shops or AI-written sites. Exa searches nothing outside this list.
 */
export const RESEARCH_DOMAINS = [
  "pubmed.ncbi.nlm.nih.gov",
  "pmc.ncbi.nlm.nih.gov",
  "ncbi.nlm.nih.gov",
  "cochranelibrary.com",
  "nih.gov",
  "niddk.nih.gov",
  "cdc.gov",
  "nhs.uk",
  "nice.org.uk",
  "who.int",
  "gut.bmj.com",
  "bmj.com",
  "gastrojournal.org",
  "journals.lww.com",
  "thelancet.com",
  "nature.com",
] as const;

/** Few results, short excerpts: enough to cite, small enough not to bloat the coach's context. */
const MAX_RESULTS = 5;
const EXCERPT_CHARACTERS = 600;

export type ResearchResult = {
  title: string;
  /** The site it came from, e.g. "cochranelibrary.com". */
  source: string;
  url: string;
  /** Year published, when known. */
  year: number | null;
  /** The passages most relevant to the query. */
  excerpt: string;
};

export type ResearchSearch = (query: string) => Promise<ResearchResult[]>;

/** Exa-backed search, limited to RESEARCH_DOMAINS. */
export function createExaSearch(apiKey: string): ResearchSearch {
  const exa = new Exa(apiKey);
  return async (query) => {
    const response = await exa.search(query, {
      numResults: MAX_RESULTS,
      includeDomains: [...RESEARCH_DOMAINS],
      contents: { highlights: { maxCharacters: EXCERPT_CHARACTERS } },
    });
    return response.results.map((result) => ({
      title: result.title?.trim() || "Untitled",
      source: new URL(result.url).hostname.replace(/^www\./, ""),
      url: result.url,
      year: result.publishedDate ? new Date(result.publishedDate).getFullYear() : null,
      excerpt: ("highlights" in result && Array.isArray(result.highlights) ? result.highlights.join(" … ") : "").slice(
        0,
        EXCERPT_CHARACTERS,
      ),
    }));
  };
}

/** The search to use, or null when no Exa key is set (the coach then simply has no search tool). */
export function getResearchSearch(): ResearchSearch | null {
  const apiKey = process.env.EXA_API_KEY;
  return apiKey ? createExaSearch(apiKey) : null;
}
