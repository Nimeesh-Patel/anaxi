// MCP REST client — web → MCP server → external APIs
// Set MCP_URL in .env.local (Railway URL in prod, http://localhost:3001 in dev)

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001";

async function callTool<T>(
  name: string,
  args: Record<string, unknown>,
  revalidate = 300
): Promise<T> {
  const res = await fetch(`${MCP_URL}/tools/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
    next: { revalidate },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(`MCP tool ${name}: ${err.error ?? res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type ArxivPaper = {
  id: string;
  version: number;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  updated: string;
  categories: string[];
  htmlUrl: string;
  pdfUrl: string;
  absUrl: string;
  hasHtml?: boolean;
};

export async function searchPapers(
  query: string,
  start = 0,
  maxResults = 10
): Promise<{ papers: ArxivPaper[]; total: number }> {
  return callTool("search_papers", { query, start, max_results: maxResults });
}

export async function getPaper(id: string): Promise<ArxivPaper | null> {
  return callTool<ArxivPaper>("get_paper", { arxiv_id: id }, 3600).catch(() => null);
}
