import { query } from "../index.js";
import { getAIService } from "./provider.js";

export interface RagConfig {
  topK: number;
  similarityThreshold: number;
  maxContextSize: number;
}

export function getRagConfig(): RagConfig {
  return {
    topK: parseInt(process.env.RAG_TOP_K || "5", 10),
    similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.48"),
    maxContextSize: parseInt(process.env.RAG_MAX_CONTEXT_SIZE || "4000", 10),
  };
}

// Splits document into coherent chunks with overlap
export function chunkText(text: string, maxChunkLength = 500, overlap = 80): string[] {
  const cleaned = text.trim().replace(/\r\n/g, "\n");
  if (!cleaned) return [];

  if (cleaned.length <= maxChunkLength) {
    return [cleaned];
  }

  // Split by paragraphs first
  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 2 <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If single paragraph is longer than maxChunkLength, split by sentences
      if (trimmed.length > maxChunkLength) {
        const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)/g) || [trimmed];
        let sentChunk = "";
        for (const sent of sentences) {
          if (sentChunk.length + sent.length <= maxChunkLength) {
            sentChunk += sent;
          } else {
            if (sentChunk) chunks.push(sentChunk.trim());
            sentChunk = sent;
          }
        }
        if (sentChunk.trim()) {
          currentChunk = sentChunk.trim();
        } else {
          currentChunk = "";
        }
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.filter((c) => c.trim().length > 10);
}

// Index or re-index a knowledge document into knowledge_chunks
export async function indexDocument(documentId: string): Promise<number> {
  const docs = await query<{ id: string; title: string; content: string; status: string }>(
    "SELECT id, title, content, status FROM knowledge_documents WHERE id = $1",
    [documentId]
  );

  if (!docs || docs.length === 0) {
    throw new Error(`Knowledge document not found: ${documentId}`);
  }

  const doc = docs[0];

  // If document is draft, remove any existing chunks so it won't be searched
  if (doc.status !== "published") {
    await query("DELETE FROM knowledge_chunks WHERE document_id = $1", [documentId]);
    return 0;
  }

  // Delete existing chunks before indexing new ones
  await query("DELETE FROM knowledge_chunks WHERE document_id = $1", [documentId]);

  const fullText = `Title: ${doc.title}\n\n${doc.content}`;
  const textChunks = chunkText(fullText);

  if (textChunks.length === 0) return 0;

  const aiService = getAIService();
  let indexedCount = 0;

  for (let i = 0; i < textChunks.length; i++) {
    const chunkContent = textChunks[i];
    try {
      const embedding = await aiService.generateEmbedding(chunkContent);
      const chunkId = `chunk_${documentId}_${i}_${Date.now()}`;
      const vectorLiteral = `[${embedding.join(",")}]`;

      await query(
        `INSERT INTO knowledge_chunks (id, document_id, content, embedding, chunk_index, created_at)
         VALUES ($1, $2, $3, $4::vector, $5, NOW())`,
        [chunkId, documentId, chunkContent, vectorLiteral, i]
      );
      indexedCount++;
    } catch (err: any) {
      console.error(`Failed to generate embedding for chunk ${i} of document ${documentId}:`, err);
    }
  }

  return indexedCount;
}

// Re-index all published knowledge documents
export async function reindexAllKnowledge(): Promise<{ totalDocs: number; totalChunks: number }> {
  const docs = await query<{ id: string }>(
    "SELECT id FROM knowledge_documents WHERE status = 'published'"
  );

  let totalChunks = 0;
  for (const doc of docs) {
    const count = await indexDocument(doc.id);
    totalChunks += count;
  }

  return { totalDocs: docs.length, totalChunks };
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
}

// Retrieve relevant chunks for a question using pgvector cosine distance
export async function retrieveRelevantChunks(
  userQuery: string,
  options?: Partial<RagConfig>
): Promise<RetrievedChunk[]> {
  const config = { ...getRagConfig(), ...options };
  const aiService = getAIService();

  let queryEmbedding: number[];
  try {
    queryEmbedding = await aiService.generateEmbedding(userQuery);
  } catch (err) {
    console.error("Failed to generate embedding for query in RAG:", err);
    return [];
  }

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  try {
    // 1 - (embedding <=> $1::vector) gives cosine similarity
    const rows = await query<{
      id: string;
      document_id: string;
      content: string;
      similarity: string | number;
    }>(
      `SELECT c.id, c.document_id, c.content,
              (1 - (c.embedding <=> $1::vector)) AS similarity
       FROM knowledge_chunks c
       JOIN knowledge_documents d ON c.document_id = d.id
       WHERE d.status = 'published'
         AND (1 - (c.embedding <=> $1::vector)) >= $2
       ORDER BY similarity DESC
       LIMIT $3`,
      [vectorLiteral, config.similarityThreshold, config.topK]
    );

    let totalLength = 0;
    const result: RetrievedChunk[] = [];

    for (const r of rows) {
      const sim = typeof r.similarity === "string" ? parseFloat(r.similarity) : r.similarity;
      if (totalLength + r.content.length <= config.maxContextSize) {
        result.push({
          id: r.id,
          documentId: r.document_id,
          content: r.content,
          similarity: sim,
        });
        totalLength += r.content.length;
      }
    }

    return result;
  } catch (err: any) {
    console.error("Vector search query error in Neon:", err);
    return [];
  }
}
