// Sarvam AI wrapper — chat completion for summarize/rank tools
// Docs: https://docs.sarvam.ai/
// Get API key at dashboard.sarvam.ai

const SARVAM_API = "https://api.sarvam.ai/v1/chat/completions";

export async function chat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  apiKey?: string
): Promise<string> {
  const key = apiKey ?? process.env.SARVAM_API_KEY;
  if (!key) {
    throw new Error("SARVAM_API_KEY not set. Get one at dashboard.sarvam.ai");
  }

  const res = await fetch(SARVAM_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "sarvam-m",
      messages,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sarvam API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}
