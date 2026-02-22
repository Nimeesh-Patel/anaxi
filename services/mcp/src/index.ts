import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v3";
import {
  searchArxiv,
  getArxivPaper,
  getArxivPaperHtml,
} from "./tools/arxiv.js";
import {
  searchSemanticScholar,
  getSemanticScholarPaper,
  getSemanticScholarReferences,
  getSemanticScholarCitations,
} from "./tools/semantic-scholar.js";

const server = new McpServer({
  name: "anaxi",
  version: "0.1.0",
});

// ── helper ────────────────────────────────────────────────────────────────────
// TypeScript 5.9 + Zod 4 hits TS2589 (type instantiation too deep) with MCP
// SDK's complex ZodRawShapeCompat generics. Cast config to `any` to sidestep
// the constraint check; runtime Zod validation is unaffected.
type ToolConfig = {
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
};

function registerTool<T extends Record<string, unknown>>(
  name: string,
  config: ToolConfig,
  handler: (args: T) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.registerTool(name, config as any, handler as any);
}

// ── arXiv tools ───────────────────────────────────────────────────────────────

registerTool<{ query: string; start?: number; max_results?: number }>(
  "search_arxiv",
  {
    description:
      "Search arXiv for papers by keyword, author, or topic. Returns title, authors, abstract, categories, and links.",
    inputSchema: {
      query: z.string().describe("Search query (keywords, author names, topics)"),
      start: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
      max_results: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of results (1-50, default 10)"),
    },
  },
  async ({ query, start, max_results }) => {
    const { papers, total } = await searchArxiv(query, start ?? 0, max_results ?? 10);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ total, papers }, null, 2) }],
    };
  }
);

registerTool<{ arxiv_id: string }>(
  "get_arxiv_paper",
  {
    description:
      "Fetch metadata for a specific arXiv paper by its ID (e.g. '1706.03762' or 'hep-ex/0307015').",
    inputSchema: {
      arxiv_id: z.string().describe("arXiv paper ID, e.g. '2307.09288' or '1706.03762'"),
    },
  },
  async ({ arxiv_id }) => {
    const paper = await getArxivPaper(arxiv_id);
    if (!paper) {
      return {
        content: [{ type: "text" as const, text: `Paper '${arxiv_id}' not found on arXiv.` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(paper, null, 2) }],
    };
  }
);

registerTool<{ arxiv_id: string }>(
  "get_arxiv_paper_text",
  {
    description:
      "Fetch the full text content of an arXiv paper's HTML version (if available). Returns plain text stripped of HTML tags.",
    inputSchema: {
      arxiv_id: z.string().describe("arXiv paper ID, e.g. '2307.09288'"),
    },
  },
  async ({ arxiv_id }) => {
    const text = await getArxivPaperHtml(arxiv_id);
    if (!text) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No HTML version available for '${arxiv_id}'. Try get_arxiv_paper for metadata only.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text }],
    };
  }
);

// ── Semantic Scholar tools ────────────────────────────────────────────────────

registerTool<{ query: string; limit?: number }>(
  "search_semantic_scholar",
  {
    description:
      "Search Semantic Scholar for papers. Returns richer data than arXiv search: citation counts, TL;DR summaries, and open-access PDF links.",
    inputSchema: {
      query: z.string().describe("Search query"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Number of results (1-100, default 10)"),
    },
  },
  async ({ query, limit }) => {
    const { papers, total } = await searchSemanticScholar(query, limit ?? 10);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ total, papers }, null, 2) }],
    };
  }
);

registerTool<{ arxiv_id: string }>(
  "get_semantic_scholar_paper",
  {
    description:
      "Get detailed metadata for a paper via Semantic Scholar using its arXiv ID. Includes citation count, TL;DR, references count, and open-access PDF URL.",
    inputSchema: {
      arxiv_id: z.string().describe("arXiv paper ID, e.g. '1706.03762'"),
    },
  },
  async ({ arxiv_id }) => {
    const paper = await getSemanticScholarPaper(arxiv_id);
    if (!paper) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Paper '${arxiv_id}' not found on Semantic Scholar.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify(paper, null, 2) }],
    };
  }
);

registerTool<{ arxiv_id: string; limit?: number }>(
  "get_paper_references",
  {
    description: "Get the list of papers that a given arXiv paper cites (its reference list).",
    inputSchema: {
      arxiv_id: z.string().describe("arXiv paper ID"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max references to return (default 20)"),
    },
  },
  async ({ arxiv_id, limit }) => {
    const refs = await getSemanticScholarReferences(arxiv_id, limit ?? 20);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(refs, null, 2) }],
    };
  }
);

registerTool<{ arxiv_id: string; limit?: number }>(
  "get_paper_citations",
  {
    description: "Get papers that cite a given arXiv paper (who cited it).",
    inputSchema: {
      arxiv_id: z.string().describe("arXiv paper ID"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max citations to return (default 20)"),
    },
  },
  async ({ arxiv_id, limit }) => {
    const citations = await getSemanticScholarCitations(arxiv_id, limit ?? 20);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(citations, null, 2) }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Anaxi MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
