// arXiv API tools for MCP
// API docs: https://info.arxiv.org/help/api/index.html

const ARXIV_API = "https://export.arxiv.org/api/query";

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
};

function parseId(rawId: string): { id: string; version: number } {
  const newStyle = rawId.match(/(\d{4}\.\d{4,5})(v(\d+))?$/);
  if (newStyle)
    return { id: newStyle[1], version: newStyle[3] ? parseInt(newStyle[3]) : 1 };
  const oldStyle = rawId.match(/([a-z-]+\/\d{7})(v(\d+))?$/);
  if (oldStyle)
    return { id: oldStyle[1], version: oldStyle[3] ? parseInt(oldStyle[3]) : 1 };
  return { id: rawId, version: 1 };
}

function parseAtomFeed(xml: string): { papers: ArxivPaper[]; total: number } {
  const totalMatch = xml.match(
    /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/
  );
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
  const papers: ArxivPaper[] = [];
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const get = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : "";
    };

    const rawId = get("id");
    const { id, version } = parseId(rawId);

    const authors: string[] = [];
    const authorRegex =
      /<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
    let am;
    while ((am = authorRegex.exec(entry)) !== null) {
      authors.push(am[1].trim());
    }

    const categories: string[] = [];
    const catRegex = /<category[^>]*term="([^"]*)"[^>]*\/>/g;
    let cm;
    while ((cm = catRegex.exec(entry)) !== null) {
      categories.push(cm[1]);
    }

    papers.push({
      id,
      version,
      title: get("title").replace(/\s+/g, " "),
      authors,
      abstract: get("summary").replace(/\s+/g, " "),
      published: get("published"),
      updated: get("updated"),
      categories,
      htmlUrl: `https://arxiv.org/html/${id}`,
      pdfUrl: `https://arxiv.org/pdf/${id}`,
      absUrl: `https://arxiv.org/abs/${id}`,
    });
  }

  return { papers, total };
}

export async function searchArxiv(
  query: string,
  start = 0,
  maxResults = 10
): Promise<{ papers: ArxivPaper[]; total: number }> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: String(start),
    max_results: String(maxResults),
    sortBy: "relevance",
  });

  const res = await fetch(`${ARXIV_API}?${params}`, {
    headers: { "User-Agent": "Anaxi-MCP/1.0 (open science platform)" },
  });
  if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);
  return parseAtomFeed(await res.text());
}

export async function getArxivPaper(id: string): Promise<ArxivPaper | null> {
  const params = new URLSearchParams({ id_list: id });
  const res = await fetch(`${ARXIV_API}?${params}`, {
    headers: { "User-Agent": "Anaxi-MCP/1.0 (open science platform)" },
  });
  if (!res.ok) return null;
  const { papers } = parseAtomFeed(await res.text());
  return papers[0] ?? null;
}

export async function getArxivPaperHtml(id: string): Promise<string | null> {
  const url = `https://arxiv.org/html/${id}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Anaxi-MCP/1.0 (open science platform)" },
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  // If arxiv redirects to abs page or returns non-HTML, it has no HTML version
  if (!contentType.includes("text/html")) return null;
  const html = await res.text();
  // Strip script/style tags for a cleaner text representation
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
