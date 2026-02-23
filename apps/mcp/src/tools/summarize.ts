import { getPaper, getPaperHtml } from "@anaxi/arxiv";
import { chat } from "../services/sarvam.js";

export async function run(
  arxivId: string
): Promise<{ content: { type: "text"; text: string }[]; isError?: boolean }> {
  const paper = await getPaper(arxivId, "Anaxi-MCP/1.0");
  if (!paper) {
    return {
      content: [{ type: "text" as const, text: `Paper '${arxivId}' not found.` }],
      isError: true,
    };
  }
  const text = await getPaperHtml(arxivId, "Anaxi-MCP/1.0");
  const content = text ?? `${paper.title}\n\n${paper.abstract}`;
  const truncated = content.slice(0, 12000); // token limit
  try {
    const summary = await chat([
      {
        role: "system",
        content:
          "You are a research assistant. Summarize the following paper concisely: main contribution, method, key results. Be precise and avoid fluff.",
      },
      { role: "user", content: truncated },
    ]);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { arxivId, title: paper.title, summary },
            null,
            2
          ),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Summarization failed: ${err instanceof Error ? err.message : String(err)}. Ensure SARVAM_API_KEY is set.`,
        },
      ],
      isError: true,
    };
  }
}
