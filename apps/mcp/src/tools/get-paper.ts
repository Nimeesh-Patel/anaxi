import { getPaper, getPaperHtml } from "@anaxi/arxiv";
import * as cache from "../services/cache.js";

export async function run(
  arxivId: string,
  includeText = false
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const cacheKey = `arxiv:paper:${arxivId}`;
  let paper = cache.get<Awaited<ReturnType<typeof getPaper>>>(cacheKey);
  if (!paper) {
    paper = await getPaper(arxivId, "Anaxi-MCP/1.0");
    if (paper) cache.set(cacheKey, paper, 3600);
  }
  if (!paper) {
    return {
      content: [{ type: "text" as const, text: `Paper '${arxivId}' not found on arXiv.` }],
      isError: true,
    };
  }
  let result: Record<string, unknown> = { ...paper };
  if (includeText) {
    const text = await getPaperHtml(arxivId, "Anaxi-MCP/1.0");
    result = { ...result, fullText: text ?? null };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
