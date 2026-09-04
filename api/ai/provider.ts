import { GoogleGenAI } from "@google/genai";

export interface AIProviderConfig {
  provider: "gemini" | "openai" | "custom";
  model: string;
  apiKey: string;
  embeddingModel: string;
}

export interface AIService {
  generateAnswer(params: {
    prompt: string;
    systemPrompt: string;
    contextChunks: string[];
  }): Promise<string>;

  generateEmbedding(text: string): Promise<number[]>;
}

export function getAIConfig(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase() as "gemini" | "openai" | "custom";
  const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  const model = process.env.AI_MODEL || "gemini-3.8-flash";
  const embeddingModel = process.env.EMBEDDING_MODEL || "gemini-embedding-2-preview";

  return {
    provider,
    model,
    apiKey,
    embeddingModel,
  };
}

class GeminiAIService implements AIService {
  private ai: GoogleGenAI | null = null;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    if (config.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    }
  }

  private getClient(): GoogleGenAI | null {
    const apiKey = (process.env.AI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return null;
    }
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  async generateAnswer({
    prompt,
    systemPrompt,
    contextChunks,
  }: {
    prompt: string;
    systemPrompt: string;
    contextChunks: string[];
  }): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return "INSUFFICIENT_KNOWLEDGE";
    }

    const formattedContext = contextChunks.length > 0
      ? `APPROVED KNOWLEDGE CONTEXT:\n${contextChunks.map((chunk, idx) => `[Source ${idx + 1}]:\n${chunk}`).join("\n\n")}`
      : "NO MATCHING KNOWLEDGE FOUND.";

    const combinedSystemInstruction = `${systemPrompt}\n\nStrict Rule: You must ONLY answer using the supplied APPROVED KNOWLEDGE CONTEXT above. If the information in the context does not reliably and directly answer the question, or if no matching context exists, respond with exactly:\nINSUFFICIENT_KNOWLEDGE`;

    const userMessage = `${formattedContext}\n\nUSER QUESTION: ${prompt}`;

    // Try valid active Gemini models
    const candidateModels = Array.from(new Set([
      this.config.model,
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ]));

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{ text: `${combinedSystemInstruction}\n\n${userMessage}` }],
            },
          ],
        });

        const text = response.text?.trim() || "INSUFFICIENT_KNOWLEDGE";
        return text;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${modelName} notice: ${err?.message || err}. Trying candidate fallback...`);
      }
    }

    console.warn("All Gemini candidate models returned notice:", lastError?.message || lastError);
    return "INSUFFICIENT_KNOWLEDGE";
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const client = this.getClient();
    if (!client) return [];
    try {
      const response = await client.models.embedContent({
        model: this.config.embeddingModel,
        contents: text,
      });

      const values = (response as any).embeddings?.[0]?.values;
      if (!values || !Array.isArray(values)) {
        return [];
      }
      return values;
    } catch (err: any) {
      console.warn("Gemini embedding notice (using lexical search fallback):", err?.message || err);
      return [];
    }
  }
}

class OpenAIService implements AIService {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async generateAnswer({
    prompt,
    systemPrompt,
    contextChunks,
  }: {
    prompt: string;
    systemPrompt: string;
    contextChunks: string[];
  }): Promise<string> {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error("Missing OpenAI API key.");

    const formattedContext = contextChunks.length > 0
      ? `APPROVED KNOWLEDGE CONTEXT:\n${contextChunks.map((chunk, idx) => `[Source ${idx + 1}]:\n${chunk}`).join("\n\n")}`
      : "NO MATCHING KNOWLEDGE FOUND.";

    const systemMessage = `${systemPrompt}\n\nStrict Rule: You must ONLY answer using the supplied APPROVED KNOWLEDGE CONTEXT. If the supplied information is insufficient to answer the question reliably, respond with exactly:\nINSUFFICIENT_KNOWLEDGE`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: `${formattedContext}\n\nUSER QUESTION: ${prompt}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "INSUFFICIENT_KNOWLEDGE";
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new Error("Missing OpenAI API key.");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.embeddingModel || "text-embedding-3-small",
        input: text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI Embedding error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.data?.[0]?.embedding || [];
  }
}

// Factory to get configured AIService
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  const config = getAIConfig();
  if (config.provider === "openai") {
    return new OpenAIService(config);
  }
  // Default to Gemini
  if (!aiServiceInstance) {
    aiServiceInstance = new GeminiAIService(config);
  }
  return aiServiceInstance;
}
