// Anaxi MCP — HTTP research orchestration server (Railway-deployable)
// Exposes /mcp (MCP protocol) and /tools/:name (REST for web app)

import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { registerTools } from "./router.js";
import * as searchArxivTool from "./tools/search-arxiv.js";
import * as getPaperTool from "./tools/get-paper.js";
import * as ssTool from "./tools/semantic-scholar.js";

type Args = Record<string, unknown>;
type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const toolHandlers: Record<string, (args: Args) => Promise<ToolResult>> = {
  search_arxiv: (a) => searchArxivTool.run(String(a.query ?? ""), Number(a.start ?? 0), Number(a.max_results ?? 10)),
  search_papers: (a) => searchArxivTool.run(String(a.query ?? ""), Number(a.start ?? 0), Number(a.max_results ?? 10)),
  get_paper: (a) => getPaperTool.run(String(a.arxiv_id ?? ""), Boolean(a.include_text ?? false)),
  get_paper_text: (a) => getPaperTool.run(String(a.arxiv_id ?? ""), true),
  search_semantic_scholar: (a) => ssTool.searchPapers(String(a.query ?? ""), Number(a.limit ?? 10)),
  get_semantic_scholar_paper: (a) => ssTool.getPaperByArxivId(String(a.arxiv_id ?? "")),
  get_paper_references: (a) => ssTool.getRefs(String(a.arxiv_id ?? ""), Number(a.limit ?? 20)),
  get_paper_citations: (a) => ssTool.getCites(String(a.arxiv_id ?? ""), Number(a.limit ?? 20)),
  recommend_papers: (a) =>
    ssTool.recommendPapers(
      (a.positive_paper_ids as string[]) ?? [],
      (a.negative_paper_ids as string[]) ?? [],
      Number(a.limit ?? 20)
    ),
  get_author: (a) => ssTool.getSsAuthor(String(a.author_id ?? "")),
};

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const MCP_SERVER_TOKEN = process.env.MCP_SERVER_TOKEN;


function isAuthorized(req: express.Request): boolean {
  if (!MCP_SERVER_TOKEN) return true;
  const token = req.header("x-mcp-token");
  return token === MCP_SERVER_TOKEN;
}

function createServer(): McpServer {
  const server = new McpServer({
    name: "anaxi",
    version: "0.1.0",
  });
  registerTools(server);
  return server;
}

const app = createMcpExpressApp({
  host: process.env.HOST ?? "0.0.0.0",
  allowedHosts: process.env.ALLOWED_HOSTS?.split(",").filter(Boolean).map((h) => h.trim()),
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "x-mcp-token"],
}));

app.get("/", (_req, res) => {
  res.json({ name: "anaxi-mcp", version: "1.0.0", protocol: "mcp", endpoint: "/mcp" });
});

app.post("/mcp", async (req, res) => {
  const server = createServer();
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless for Railway
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST." },
      id: null,
    })
  );
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "anaxi-mcp" });
});

// OpenAI-style tool endpoint for backend orchestrators.
// Body shape: { name: string, arguments: object }
app.post("/tool", express.json(), async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = (req.body as { name?: string; arguments?: Args }) ?? {};
  if (!payload.name) {
    res.status(400).json({ error: "Missing tool name" });
    return;
  }

  const handler = toolHandlers[payload.name];
  if (!handler) {
    res.status(404).json({ error: `Unknown tool: ${payload.name}` });
    return;
  }

  try {
    const result = await handler(payload.arguments ?? {});
    if (result.isError) {
      res.status(500).json({ error: result.content[0]?.text ?? "Tool error" });
      return;
    }
    const text = result.content[0]?.text ?? "";
    try {
      res.json(JSON.parse(text));
    } catch {
      res.json({ text });
    }
  } catch (err) {
    console.error(`Tool ${payload.name} error:`, err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// REST endpoint for the web app: POST /tools/:name with JSON body args
app.post("/tools/:name", express.json(), async (req, res) => {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { name } = req.params;
  const handler = toolHandlers[name];
  if (!handler) {
    res.status(404).json({ error: `Unknown tool: ${name}` });
    return;
  }
  try {
    const result = await handler((req.body as Args) ?? {});
    if (result.isError) {
      res.status(500).json({ error: result.content[0]?.text ?? "Tool error" });
      return;
    }
    const text = result.content[0]?.text ?? "";
    try {
      res.json(JSON.parse(text));
    } catch {
      res.json({ text });
    }
  } catch (err) {
    console.error(`Tool ${name} error:`, err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const host = process.env.HOST ?? "0.0.0.0";
app.listen(PORT, host, () => {
  console.log(`Anaxi MCP server listening on ${host}:${PORT}`);
  console.log(`MCP endpoint: POST /mcp`);
  if (MCP_SERVER_TOKEN) {
    console.log("REST tools auth enabled (x-mcp-token required).");
  }
});
