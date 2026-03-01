interface ModelPricing {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

const PRICING_PER_TOKEN: Record<string, ModelPricing> = {
  "claude-opus-4-6": {
    input: 5e-6,
    output: 25e-6,
    cacheCreate: 6.25e-6,
    cacheRead: 0.5e-6,
  },
  "claude-sonnet-4-6": {
    input: 3e-6,
    output: 15e-6,
    cacheCreate: 3.75e-6,
    cacheRead: 0.3e-6,
  },
  "claude-haiku-4-5": {
    input: 1e-6,
    output: 5e-6,
    cacheCreate: 1.25e-6,
    cacheRead: 0.1e-6,
  },
};

const MODEL_PREFIXES = Object.keys(PRICING_PER_TOKEN);

function findPricing(model: string): ModelPricing | undefined {
  if (PRICING_PER_TOKEN[model]) return PRICING_PER_TOKEN[model];
  for (const prefix of MODEL_PREFIXES) {
    if (model.startsWith(prefix)) return PRICING_PER_TOKEN[prefix];
  }
  return undefined;
}

export function calculateCost(
  model: string,
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  },
): number {
  const pricing = findPricing(model);
  if (!pricing) return 0;

  return (
    (usage.input_tokens ?? 0) * pricing.input +
    (usage.output_tokens ?? 0) * pricing.output +
    (usage.cache_creation_input_tokens ?? 0) * pricing.cacheCreate +
    (usage.cache_read_input_tokens ?? 0) * pricing.cacheRead
  );
}

export function formatModelName(model: string): string {
  return model
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "");
}
