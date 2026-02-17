import type { ModelDefinitionConfig } from "../config/types.models.js";

const VERTEX_DEFAULT_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

const GEMINI_MODELS: ModelDefinitionConfig[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    api: "google-generative-ai",
    reasoning: true,
    input: ["text", "image"],
    cost: VERTEX_DEFAULT_COST,
    contextWindow: 1048576,
    maxTokens: 65536,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    api: "google-generative-ai",
    reasoning: true,
    input: ["text", "image"],
    cost: VERTEX_DEFAULT_COST,
    contextWindow: 1048576,
    maxTokens: 65536,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    api: "google-generative-ai",
    reasoning: false,
    input: ["text", "image"],
    cost: VERTEX_DEFAULT_COST,
    contextWindow: 1048576,
    maxTokens: 8192,
  },
];

const CLAUDE_MODELS: ModelDefinitionConfig[] = [
  {
    id: "claude-sonnet-4-5@20250514",
    name: "Claude Sonnet 4.5 (Vertex)",
    api: "anthropic-messages",
    reasoning: true,
    input: ["text", "image"],
    cost: VERTEX_DEFAULT_COST,
    contextWindow: 200000,
    maxTokens: 8192,
  },
  {
    id: "claude-opus-4-6@20250515",
    name: "Claude Opus 4.6 (Vertex)",
    api: "anthropic-messages",
    reasoning: true,
    input: ["text", "image"],
    cost: VERTEX_DEFAULT_COST,
    contextWindow: 200000,
    maxTokens: 8192,
  },
  {
    id: "claude-haiku-3-5@20241022",
    name: "Claude 3.5 Haiku (Vertex)",
    api: "anthropic-messages",
    reasoning: false,
    input: ["text", "image"],
    cost: VERTEX_DEFAULT_COST,
    contextWindow: 200000,
    maxTokens: 8192,
  },
];

export const VERTEX_MODEL_CATALOG: ModelDefinitionConfig[] = [...GEMINI_MODELS, ...CLAUDE_MODELS];

export function resolveVertexBaseUrl(params: { project: string; region: string }): string {
  return `https://${params.region}-aiplatform.googleapis.com/v1/projects/${params.project}/locations/${params.region}`;
}
