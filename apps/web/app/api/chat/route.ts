import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, createSarvamChatCompletion } from "@/lib/sarvam";

const MCP_URL = process.env.MCP_URL ?? "http://localhost:3001";
const MCP_SERVER_TOKEN = process.env.MCP_SERVER_TOKEN;
const SARVAM_MODEL = process.env.SARVAM_MODEL ?? "sarvam-m";

const tools = [
  {
    type: "function" as const,
    function: {
      name: "search_arxiv",
      description: "Search arXiv papers by query string.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search phrase" },
          start: { type: "integer", minimum: 0 },
          max_results: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["query"],
      },
    },
  },
];

type MCPToolPayload = {
  name: string;
  arguments: Record<string, unknown>;
};

async function callMcpTool(payload: MCPToolPayload): Promise<unknown> {
  const res = await fetch(`${MCP_URL}/tool`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(MCP_SERVER_TOKEN ? { "x-mcp-token": MCP_SERVER_TOKEN } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(`MCP tool ${payload.name} failed: ${err.error ?? res.statusText}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { messages?: ChatMessage[] } | null;
  const inputMessages = body?.messages;

  if (!inputMessages?.length) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  const messages: ChatMessage[] = [...inputMessages];

  for (let i = 0; i < 4; i += 1) {
    const response = await createSarvamChatCompletion({
      model: SARVAM_MODEL,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      return NextResponse.json({ error: "No response from model" }, { status: 502 });
    }

    if (!assistantMessage.tool_calls?.length) {
      if (assistantMessage.content) {
        messages.push({ role: "assistant", content: assistantMessage.content });
      }
      return NextResponse.json({ message: assistantMessage.content ?? "" });
    }

    messages.push({ role: "assistant", content: assistantMessage.content ?? "" });

    for (const toolCall of assistantMessage.tool_calls) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        parsedArgs = {};
      }
      const toolResult = await callMcpTool({
        name: toolCall.function.name,
        arguments: parsedArgs,
      });

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return NextResponse.json({ error: "Tool loop exceeded maximum steps" }, { status: 500 });
}
