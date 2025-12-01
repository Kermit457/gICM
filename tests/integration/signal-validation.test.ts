/**
 * Signal Validation Integration Tests
 *
 * Tests Pydantic validation on signal payloads.
 * Requires Python backend running: uvicorn src.api.app:app
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createSignal, invalidSignals } from '../fixtures/signals';

const API_URL = process.env.API_URL || 'http://localhost:8000/api/v1';
const VALID_API_KEY = process.env.GICM_API_KEY || 'test-api-key-12345';

// Helper to make authenticated requests
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': VALID_API_KEY,
    ...((options.headers as Record<string, string>) || {}),
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

describe('Signal Validation', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) {
        console.warn('Backend not running, skipping integration tests');
      }
    } catch {
      console.warn('Backend not reachable, skipping integration tests');
    }
  });

  describe('Token Pattern Validation', () => {
    it('accepts valid alphanumeric token', async () => {
      const signal = createSignal({ token: 'SOL' });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
    });

    it('accepts token with underscores and hyphens', async () => {
      const signal = createSignal({ token: 'PEPE_COIN-V2' });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
    });

    it('rejects token with invalid characters', async () => {
      const signal = {
        ...createSignal(),
        token: 'invalid token!@#',
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('accepts null token', async () => {
      const signal = createSignal({ token: null, chain: null });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe('Confidence Range Validation', () => {
    it('accepts confidence at lower bound (0)', async () => {
      // Note: 0 confidence will be rejected by business logic, but should pass validation
      const signal = createSignal({ confidence: 0 });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      // 200 means validation passed (even if rejected by business logic)
      expect(res.status).toBe(200);
    });

    it('accepts confidence at upper bound (100)', async () => {
      const signal = createSignal({ confidence: 100 });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
    });

    it('rejects confidence above 100', async () => {
      const signal = {
        ...createSignal(),
        confidence: 150,
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects negative confidence', async () => {
      const signal = {
        ...createSignal(),
        confidence: -10,
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });
  });

  describe('Enum Validation', () => {
    it('rejects invalid urgency value', async () => {
      const signal = {
        ...createSignal(),
        urgency: 'never',
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects invalid action value', async () => {
      const signal = {
        ...createSignal(),
        action: 'yolo',
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects invalid risk value', async () => {
      const signal = {
        ...createSignal(),
        risk: 'super-high',
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects invalid chain value', async () => {
      const signal = {
        ...createSignal(),
        chain: 'bitcoin',
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });
  });

  describe('String Length Validation', () => {
    it('rejects title exceeding max length', async () => {
      const signal = {
        ...createSignal(),
        title: 'A'.repeat(300),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects description exceeding max length', async () => {
      const signal = {
        ...createSignal(),
        description: 'B'.repeat(3000),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects reasoning exceeding max length', async () => {
      const signal = {
        ...createSignal(),
        reasoning: 'C'.repeat(3000),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });
  });

  describe('Collection Size Validation', () => {
    it('rejects metrics dict exceeding 50 keys', async () => {
      const signal = {
        ...createSignal(),
        metrics: Object.fromEntries(
          Array.from({ length: 60 }, (_, i) => [`key${i}`, i])
        ),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('accepts metrics dict with 50 keys', async () => {
      const signal = {
        ...createSignal(),
        metrics: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`key${i}`, i])
        ),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
    });

    it('rejects riskFactors array exceeding max items', async () => {
      const signal = {
        ...createSignal(),
        riskFactors: Array.from({ length: 25 }, (_, i) => `Risk factor ${i}`),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects tags array exceeding max items', async () => {
      const signal = {
        ...createSignal(),
        tags: Array.from({ length: 25 }, (_, i) => `tag${i}`),
      };
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(422);
    });
  });

  describe('Malformed Request Handling', () => {
    it('rejects malformed JSON', async () => {
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: '{ invalid json }',
      });

      expect(res.status).toBe(422);
    });

    it('rejects missing required fields', async () => {
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({
          signals: [{ id: 'test' }], // Missing required fields
        }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects empty signals array', async () => {
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [] }),
      });

      // Empty array might be 200 with 0 processed, or 422
      // Either is acceptable behavior
      expect([200, 422]).toContain(res.status);
    });
  });

  describe('AnalyzeRequest Validation', () => {
    it('rejects invalid token pattern in analyze request', async () => {
      const res = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid token!@#',
          chain: 'solana',
        }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects invalid chain in analyze request', async () => {
      const res = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          token: 'SOL',
          chain: 'invalid-chain',
        }),
      });

      expect(res.status).toBe(422);
    });

    it('rejects context with too many keys', async () => {
      const res = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          token: 'SOL',
          chain: 'solana',
          context: Object.fromEntries(
            Array.from({ length: 25 }, (_, i) => [`key${i}`, `value${i}`])
          ),
        }),
      });

      expect(res.status).toBe(422);
    });
  });
});
