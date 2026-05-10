import OpenAI from "openai";

export const AI_MODEL =
  process.env.AI_MODEL ??
  process.env.GROQ_MODEL ??
  process.env.NVIDIA_MODEL ??
  "llama-3.1-8b-instant";

const providers = [
  {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  },
  {
    name: "NVIDIA NIM",
    baseURL: process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY,
  },
].filter((provider) => Boolean(provider.apiKey));

export function hasAIProvider(): boolean {
  return providers.length > 0;
}

export async function createChatCompletion(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  let lastError: unknown;

  for (const provider of providers) {
    try {
      const client = new OpenAI({
        baseURL: provider.baseURL,
        apiKey: provider.apiKey,
      });
      return await client.chat.completions.create(params);
    } catch (error) {
      lastError = error;
      console.error(`[AI] ${provider.name} request failed, trying next provider if configured.`);
    }
  }

  if (!providers.length) {
    throw new Error("No AI provider configured. Set GROQ_API_KEY or NVIDIA_API_KEY.");
  }

  throw lastError instanceof Error ? lastError : new Error("AI provider request failed.");
}
