/**
 * Test fixtures for Hunter Signal integration tests
 */

export interface TestSignal {
  id: string;
  type: string;
  source: string;
  token: string | null;
  chain: string | null;
  action: string;
  confidence: number;
  urgency: string;
  title: string;
  description: string;
  reasoning: string;
  risk: string;
  riskFactors: string[];
  tags: string[];
  metrics: Record<string, unknown>;
}

// Valid signal that should be queued
export const validSignal: TestSignal = {
  id: 'test-signal-001',
  type: 'price_move',
  source: 'binance',
  token: 'SOL',
  chain: 'solana',
  action: 'buy',
  confidence: 75,
  urgency: 'today',
  title: 'SOL breakout detected',
  description: 'Price broke above key resistance level with strong volume',
  reasoning: 'Technical breakout confirmed with 2x average volume',
  risk: 'medium',
  riskFactors: ['Market volatility', 'BTC correlation'],
  tags: ['breakout', 'technical'],
  metrics: { volume: 1000000, priceChange: 5.2 },
};

// High confidence signal (should trigger background analysis)
export const highConfidenceSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-high',
  confidence: 85,
  urgency: 'immediate',
};

// Low confidence signal (should be rejected)
export const lowConfidenceSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-low',
  confidence: 30,
};

// Extreme risk signal (should be rejected)
export const extremeRiskSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-extreme',
  risk: 'extreme',
};

// Sell signal (should be rejected - not actionable)
export const sellSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-sell',
  action: 'sell',
};

// Hold signal (should be rejected - not actionable)
export const holdSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-hold',
  action: 'hold',
};

// Watch signal (should be queued)
export const watchSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-watch',
  action: 'watch',
  confidence: 60,
};

// Signal without token (valid but no analysis triggered)
export const noTokenSignal: TestSignal = {
  ...validSignal,
  id: 'test-signal-no-token',
  token: null,
  chain: null,
};

// Invalid signals for validation tests
export const invalidSignals = {
  // Invalid token pattern
  invalidToken: {
    ...validSignal,
    id: 'test-invalid-token',
    token: 'invalid token with spaces!',
  },

  // Confidence out of range
  confidenceTooHigh: {
    ...validSignal,
    id: 'test-confidence-high',
    confidence: 150,
  },

  confidenceNegative: {
    ...validSignal,
    id: 'test-confidence-neg',
    confidence: -10,
  },

  // Invalid urgency
  invalidUrgency: {
    ...validSignal,
    id: 'test-invalid-urgency',
    urgency: 'never',
  },

  // Invalid action
  invalidAction: {
    ...validSignal,
    id: 'test-invalid-action',
    action: 'yolo',
  },

  // Invalid risk
  invalidRisk: {
    ...validSignal,
    id: 'test-invalid-risk',
    risk: 'super-high',
  },

  // Invalid chain
  invalidChain: {
    ...validSignal,
    id: 'test-invalid-chain',
    chain: 'bitcoin',
  },

  // Title too long
  titleTooLong: {
    ...validSignal,
    id: 'test-title-long',
    title: 'A'.repeat(300),
  },

  // Description too long
  descriptionTooLong: {
    ...validSignal,
    id: 'test-desc-long',
    description: 'B'.repeat(3000),
  },

  // Too many metrics
  tooManyMetrics: {
    ...validSignal,
    id: 'test-many-metrics',
    metrics: Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [`key${i}`, i])
    ),
  },
};

// Batch of mixed signals for testing filtering
export const mixedSignalBatch: TestSignal[] = [
  validSignal,
  highConfidenceSignal,
  lowConfidenceSignal,
  extremeRiskSignal,
  sellSignal,
  watchSignal,
];

// Generate unique signal ID
export function generateSignalId(): string {
  return `test-signal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Create signal with unique ID
export function createSignal(overrides: Partial<TestSignal> = {}): TestSignal {
  return {
    ...validSignal,
    id: generateSignalId(),
    ...overrides,
  };
}
