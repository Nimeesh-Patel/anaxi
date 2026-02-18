// arXiv API client
// Docs: https://info.arxiv.org/help/api/index.html

const ARXIV_API = "https://export.arxiv.org/api/query";

export type ArxivPaper = {
  id: string;          // e.g. "2307.09288"
  version: number;
  title: string;
  authors: string[];
  abstract: string;
  published: string;
  updated: string;
  categories: string[];
  hasHtml: boolean;    // whether arxiv.org/html/{id} is likely available
};

function parseId(rawId: string): { id: string; version: number } {
  // rawId: "http://arxiv.org/abs/2307.09288v2"
  const match = rawId.match(/(\d{4}\.\d{4,5})(v(\d+))?$/);
  if (!match) return { id: rawId, version: 1 };
  return { id: match[1], version: match[3] ? parseInt(match[3]) : 1 };
}


export async function searchPapers(
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
    headers: { "User-Agent": "Anaxi/1.0 (open science platform)" },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);
  const xml = await res.text();

  return parseAtomFeed(xml);
}

function parseAtomFeed(xml: string): { papers: ArxivPaper[]; total: number } {
  // Minimal Atom XML parser without DOM dependency (server-safe)
  const totalMatch = xml.match(/<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/);
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
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
    const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
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
      hasHtml: categories.some((c) =>
        c.startsWith("cs.") || c.startsWith("math.") || c.startsWith("physics.")
      ),
    });
  }

  return { papers, total };
}

export async function getPaper(id: string): Promise<ArxivPaper | null> {
  const params = new URLSearchParams({
    id_list: id,
  });
  const res = await fetch(`${ARXIV_API}?${params}`, {
    headers: { "User-Agent": "Anaxi/1.0 (open science platform)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const xml = await res.text();
  const { papers } = parseAtomFeed(xml);
  return papers[0] ?? null;
}
