import { getPaper } from "@anaxi/arxiv";
import { getPaper as getSSPaper } from "@anaxi/semantic-scholar";
import { chat } from "../services/sarvam.js";

export async function run(
  arxivIds: string[]
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  if (arxivIds.length === 0) {
    return {
      content: [{ type: "text" as const, text: "No papers to rank." }],
      isError: true,
    };
  }
  const papers: { id: string; title: string; abstract: string; citations?: number }[] = [];
  for (const id of arxivIds.slice(0, 10)) {
    const arxiv = await getPaper(id, "Anaxi-MCP/1.0");
    const ss = await getSSPaper(id, "Anaxi-MCP/1.0");
    if (arxiv) {
      papers.push({
        id,
        title: arxiv.title,
        abstract: arxiv.abstract,
        citations: ss?.citationCount,
      });
    }
  }
  const input = papers
    .map(
      (p) =>
        `[${p.id}] ${p.title}\nAbstract: ${p.abstract.slice(0, 300)}...\nCitations: ${p.citations ?? "N/A"}`
    )
    .join("\n\n---\n\n");
  try {
    const ranked = await chat([
      {
        role: "system",
        content:
          "You rank research papers by impact and relevance. Given a list of papers with metadata, return a JSON array of arXiv IDs in order of recommended priority (best first). Only include IDs from the input. No explanation.",
      },
      { role: "user", content: input },
    ]);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { inputIds: arxivIds, rankedIds: parseRankedIds(ranked) },
            null,
            2
          ),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Ranking failed: ${err instanceof Error ? err.message : String(err)}. Ensure SARVAM_API_KEY is set.`,
        },
      ],
      isError: true,
    };
  }
}

function parseRankedIds(text: string): string[] {
  const match = text.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
