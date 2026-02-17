import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mariozechner/pi-ai", () => ({
  getEnvApiKey: vi.fn(),
}));

import { getEnvApiKey } from "@mariozechner/pi-ai";

const mockedGetEnvApiKey = vi.mocked(getEnvApiKey);

async function loadVertexModels() {
  return import("./vertex-models.js");
}

async function loadProviders() {
  return import("./models-config.providers.js");
}

describe("vertex-models", () => {
  describe("VERTEX_MODEL_CATALOG", () => {
    it("contains both Gemini and Claude models", async () => {
      const { VERTEX_MODEL_CATALOG } = await loadVertexModels();
      expect(VERTEX_MODEL_CATALOG.length).toBeGreaterThan(0);

      const geminiModels = VERTEX_MODEL_CATALOG.filter(
        (m) => m.api === "google-generative-ai",
      );
      const claudeModels = VERTEX_MODEL_CATALOG.filter(
        (m) => m.api === "anthropic-messages",
      );

      expect(geminiModels.length).toBeGreaterThan(0);
      expect(claudeModels.length).toBeGreaterThan(0);
    });

    it("all models have valid required fields", async () => {
      const { VERTEX_MODEL_CATALOG } = await loadVertexModels();
      for (const model of VERTEX_MODEL_CATALOG) {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.api).toBeTruthy();
        expect(model.input.length).toBeGreaterThan(0);
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxTokens).toBeGreaterThan(0);
      }
    });
  });

  describe("resolveVertexBaseUrl", () => {
    it("constructs the correct Vertex AI base URL", async () => {
      const { resolveVertexBaseUrl } = await loadVertexModels();
      const url = resolveVertexBaseUrl({ project: "my-project", region: "us-central1" });
      expect(url).toBe(
        "https://us-central1-aiplatform.googleapis.com/v1/projects/my-project/locations/us-central1",
      );
    });

    it("uses the specified region in the hostname", async () => {
      const { resolveVertexBaseUrl } = await loadVertexModels();
      const url = resolveVertexBaseUrl({ project: "proj", region: "europe-west4" });
      expect(url).toContain("europe-west4-aiplatform.googleapis.com");
      expect(url).toContain("locations/europe-west4");
    });
  });
});

describe("resolveImplicitVertexProvider", () => {
  beforeEach(() => {
    mockedGetEnvApiKey.mockReset();
  });

  it("returns null when ADC is not available and not explicitly enabled", async () => {
    mockedGetEnvApiKey.mockReturnValue(undefined);
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      env: {},
    });
    expect(result).toBeNull();
  });

  it("returns null when explicitly disabled", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      config: { models: { vertexDiscovery: { enabled: false } } },
      env: { GOOGLE_CLOUD_PROJECT: "my-project" },
    });
    expect(result).toBeNull();
  });

  it("returns null when no project ID is available", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      env: {},
    });
    expect(result).toBeNull();
  });

  it("returns provider config when ADC and project are available", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      env: { GOOGLE_CLOUD_PROJECT: "my-project" },
    });
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toContain("my-project");
    expect(result!.baseUrl).toContain("us-central1");
    expect(result!.models.length).toBeGreaterThan(0);
  });

  it("reads project from CLOUDSDK_CORE_PROJECT", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      env: { CLOUDSDK_CORE_PROJECT: "sdk-project" },
    });
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toContain("sdk-project");
  });

  it("reads region from config over env", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      config: { models: { vertexDiscovery: { region: "europe-west4" } } },
      env: { GOOGLE_CLOUD_PROJECT: "proj", GOOGLE_CLOUD_REGION: "us-east1" },
    });
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toContain("europe-west4");
  });

  it("reads region from GOOGLE_CLOUD_REGION env var", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      env: { GOOGLE_CLOUD_PROJECT: "proj", GOOGLE_CLOUD_REGION: "asia-southeast1" },
    });
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toContain("asia-southeast1");
  });

  it("defaults region to us-central1", async () => {
    mockedGetEnvApiKey.mockReturnValue("some-token");
    const { resolveImplicitVertexProvider } = await loadProviders();
    const result = await resolveImplicitVertexProvider({
      agentDir: "/tmp/test-agent",
      env: { GOOGLE_CLOUD_PROJECT: "proj" },
    });
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toContain("us-central1");
  });
});
