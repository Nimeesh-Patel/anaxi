import { searchArxiv } from "@anaxi/arxiv";
import * as cache from "../services/cache.js";

export async function run(
  query: string,
  start = 0,
  maxResults = 10
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const cacheKey = `arxiv:search:${query}:${start}:${maxResults}`;
  const cached = cache.get<{ papers: unknown[]; total: number }>(cacheKey);
  if (cached) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify(cached, null, 2) }],
    };
  }
  const { papers, total } = await searchArxiv(query, start, maxResults, "Anaxi-MCP/1.0");
  cache.set(cacheKey, { papers, total }, 300);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ total, papers }, null, 2) }],
  };
}
