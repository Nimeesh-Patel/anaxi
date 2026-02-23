// Tool routing — registers all MCP tools with the server
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as searchArxiv from "./tools/search-arxiv.js";
import * as getPaper from "./tools/get-paper.js";
import * as ss from "./tools/semantic-scholar.js";
import {
  createSupabaseClient,
  getComments,
  postComment,
  savePaper,
  unsavePaper,
  listSavedPapers,
} from "@anaxi/database";

type ToolConfig = {
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
};

function registerTool<T extends Record<string, unknown>>(
  server: McpServer,
  name: string,
  config: ToolConfig,
  handler: (args: T) => Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.registerTool(name, config as any, handler as any);
}

export function registerTools(server: McpServer): void {
  // ── arXiv ─────────────────────────────────────────────────────────────────
  registerTool<{ query: string; start?: number; max_results?: number }>(
    server,
    "search_papers",
    {
      description: "Search arXiv by keyword, author, or topic.",
      inputSchema: {
        query: z.string().describe("Search query"),
        start: z.number().int().min(0).optional().describe("Pagination offset"),
        max_results: z.number().int().min(1).max(50).optional().describe("Results (1-50)"),
      },
    },
    async ({ query, start, max_results }) =>
      searchArxiv.run(query, start ?? 0, max_results ?? 10)
  );

  registerTool<{ arxiv_id: string; include_text?: boolean }>(
    server,
    "get_paper",
    {
      description: "Fetch paper metadata by arXiv ID.",
      inputSchema: {
        arxiv_id: z.string().describe("arXiv ID e.g. 1706.03762"),
        include_text: z.boolean().optional().describe("Include full HTML text"),
      },
    },
    async ({ arxiv_id, include_text }) => getPaper.run(arxiv_id, include_text ?? false)
  );

  registerTool<{ arxiv_id: string }>(
    server,
    "get_paper_text",
    {
      description: "Fetch full text of paper HTML version.",
      inputSchema: { arxiv_id: z.string().describe("arXiv ID") },
    },
    async ({ arxiv_id }) => getPaper.run(arxiv_id, true)
  );

  // ── Semantic Scholar ────────────────────────────────────────────────────
  registerTool<{ query: string; limit?: number }>(
    server,
    "search_semantic_scholar",
    {
      description: "Search Semantic Scholar; returns citation counts, TL;DR.",
      inputSchema: {
        query: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ query, limit }) => ss.searchPapers(query, limit ?? 10)
  );

  registerTool<{ arxiv_id: string }>(
    server,
    "get_semantic_scholar_paper",
    {
      description: "Get paper metadata via Semantic Scholar.",
      inputSchema: { arxiv_id: z.string() },
    },
    async ({ arxiv_id }) => ss.getPaperByArxivId(arxiv_id)
  );

  registerTool<{ arxiv_id: string; limit?: number }>(
    server,
    "get_paper_references",
    {
      description: "Papers cited by the given paper.",
      inputSchema: {
        arxiv_id: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ arxiv_id, limit }) => ss.getRefs(arxiv_id, limit ?? 20)
  );

  registerTool<{ arxiv_id: string; limit?: number }>(
    server,
    "get_paper_citations",
    {
      description: "Papers that cite the given paper.",
      inputSchema: {
        arxiv_id: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ arxiv_id, limit }) => ss.getCites(arxiv_id, limit ?? 20)
  );

  // ── Database (Supabase) ───────────────────────────────────────────────────
  const getDb = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    return createSupabaseClient(url, key);
  };

  registerTool<{ paper_id: string }>(
    server,
    "get_comments",
    {
      description: "Fetch paper-level discussion comments.",
      inputSchema: { paper_id: z.string() },
    },
    async ({ paper_id }) => {
      const comments = await getComments(getDb(), paper_id);
      return { content: [{ type: "text" as const, text: JSON.stringify(comments, null, 2) }] };
    }
  );

  registerTool<{ paper_id: string; content: string; user_id: string; parent_id?: string }>(
    server,
    "post_comment",
    {
      description: "Post a comment. Requires user UUID.",
      inputSchema: {
        paper_id: z.string(),
        content: z.string().min(1),
        user_id: z.string().uuid(),
        parent_id: z.string().uuid().optional(),
      },
    },
    async ({ paper_id, content, user_id, parent_id }) => {
      const comment = await postComment(getDb(), paper_id, content, user_id, parent_id);
      return { content: [{ type: "text" as const, text: JSON.stringify(comment, null, 2) }] };
    }
  );

  registerTool<{ paper_id: string; user_id: string }>(
    server,
    "save_paper",
    {
      description: "Save paper to user's reading list.",
      inputSchema: { paper_id: z.string(), user_id: z.string().uuid() },
    },
    async ({ paper_id, user_id }) => {
      await savePaper(getDb(), paper_id, user_id);
      return { content: [{ type: "text" as const, text: `Paper '${paper_id}' saved.` }] };
    }
  );

  registerTool<{ paper_id: string; user_id: string }>(
    server,
    "unsave_paper",
    {
      description: "Remove paper from reading list.",
      inputSchema: { paper_id: z.string(), user_id: z.string().uuid() },
    },
    async ({ paper_id, user_id }) => {
      await unsavePaper(getDb(), paper_id, user_id);
      return { content: [{ type: "text" as const, text: `Paper '${paper_id}' removed.` }] };
    }
  );

  registerTool<{ user_id: string }>(
    server,
    "list_saved_papers",
    {
      description: "List user's saved papers.",
      inputSchema: { user_id: z.string().uuid() },
    },
    async ({ user_id }) => {
      const saved = await listSavedPapers(getDb(), user_id);
      return { content: [{ type: "text" as const, text: JSON.stringify(saved, null, 2) }] };
    }
  );
}
