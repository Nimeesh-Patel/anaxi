import {
  search,
  getPaper,
  getReferences,
  getCitations,
  getRecommendations,
  batchGetPapers,
  getAuthor,
} from "@anaxi/semantic-scholar";
import * as cache from "../services/cache.js";

const UA = "Anaxi-MCP/1.0";
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function notFound(msg: string): ToolResult {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

export async function searchPapers(query: string, limit = 10): Promise<ToolResult> {
  const cacheKey = `ss:search:${query}:${limit}`;
  const cached = cache.get<unknown>(cacheKey);
  if (cached) return ok(cached);
  const result = await search(query, limit, UA, API_KEY);
  cache.set(cacheKey, result, 300);
  return ok(result);
}

export async function getPaperByArxivId(arxivId: string): Promise<ToolResult> {
  const cacheKey = `ss:paper:${arxivId}`;
  let paper = cache.get<Awaited<ReturnType<typeof getPaper>>>(cacheKey);
  if (!paper) {
    paper = await getPaper(arxivId, UA, API_KEY);
    if (paper) cache.set(cacheKey, paper, 3600);
  }
  if (!paper) return notFound(`Paper '${arxivId}' not found on Semantic Scholar.`);
  return ok(paper);
}

export async function getRefs(arxivId: string, limit = 20): Promise<ToolResult> {
  const refs = await getReferences(arxivId, limit, UA, API_KEY);
  return ok(refs);
}

export async function getCites(arxivId: string, limit = 20): Promise<ToolResult> {
  const cites = await getCitations(arxivId, limit, UA, API_KEY);
  return ok(cites);
}

export async function recommendPapers(
  positivePaperIds: string[],
  negativePaperIds: string[] = [],
  limit = 20
): Promise<ToolResult> {
  const cacheKey = `ss:recs:${positivePaperIds.sort().join(",")}:${negativePaperIds.sort().join(",")}:${limit}`;
  const cached = cache.get<unknown>(cacheKey);
  if (cached) return ok(cached);
  const papers = await getRecommendations(positivePaperIds, negativePaperIds, limit, UA, API_KEY);
  cache.set(cacheKey, papers, 600);
  return ok(papers);
}

export async function batchPapers(paperIds: string[]): Promise<ToolResult> {
  const papers = await batchGetPapers(paperIds, UA, API_KEY);
  return ok(papers);
}

export async function getSsAuthor(authorId: string): Promise<ToolResult> {
  const cacheKey = `ss:author:${authorId}`;
  let author = cache.get<unknown>(cacheKey);
  if (!author) {
    author = await getAuthor(authorId, UA, API_KEY);
    if (author) cache.set(cacheKey, author, 3600);
  }
  if (!author) return notFound(`Author '${authorId}' not found on Semantic Scholar.`);
  return ok(author);
}
