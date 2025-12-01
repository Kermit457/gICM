/**
 * Hunter → Trading Signal Integration Tests
 *
 * Tests the full signal flow from hunter to trading queue.
 * Requires Python backend running: uvicorn src.api.app:app
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import {
  validSignal,
  highConfidenceSignal,
  lowConfidenceSignal,
  extremeRiskSignal,
  sellSignal,
  watchSignal,
  mixedSignalBatch,
  createSignal,
  generateSignalId,
} from '../fixtures/signals';

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

// Clear signal queue before/after tests
async function clearSignalQueue(): Promise<void> {
  await fetchWithAuth('/signals/queue', { method: 'DELETE' });
}

describe('Hunter Signal Flow', () => {
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

  beforeEach(async () => {
    await clearSignalQueue();
  });

  afterEach(async () => {
    await clearSignalQueue();
  });

  describe('Signal Submission', () => {
    it('queues valid signal batch', async () => {
      const signal = createSignal({ confidence: 65 });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.received).toBe(1);
      expect(data.queued).toBe(1);
      expect(data.rejected).toBe(0);
      expect(data.results[0].status).toBe('queued');
    });

    it('triggers analysis for high-confidence signals (>=70)', async () => {
      const signal = createSignal({ confidence: 85, token: 'SOL' });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.queued).toBe(1);
      // High confidence with token triggers background analysis
      expect(data.results[0].status).toBe('analyzing');
    });

    it('queues watch signals', async () => {
      const signal = createSignal({ action: 'watch', confidence: 60 });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.queued).toBe(1);
      expect(data.rejected).toBe(0);
    });
  });

  describe('Signal Filtering', () => {
    it('rejects signals with confidence < 50', async () => {
      const signal = createSignal({ confidence: 30 });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.rejected).toBe(1);
      expect(data.queued).toBe(0);
      expect(data.results[0].status).toBe('rejected');
      expect(data.results[0].reason).toContain('Confidence');
    });

    it('rejects signals with action != buy/watch', async () => {
      const sellSig = createSignal({ action: 'sell' });
      const holdSig = createSignal({ action: 'hold' });

      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [sellSig, holdSig] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.rejected).toBe(2);
      expect(data.queued).toBe(0);
    });

    it('rejects extreme risk signals', async () => {
      const signal = createSignal({ risk: 'extreme', confidence: 80 });
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.rejected).toBe(1);
      expect(data.results[0].reason).toContain('Risk');
    });

    it('correctly filters mixed signal batch', async () => {
      // Create batch with unique IDs
      const batch = [
        createSignal({ confidence: 75, action: 'buy' }), // queue
        createSignal({ confidence: 80, action: 'watch' }), // queue
        createSignal({ confidence: 30, action: 'buy' }), // reject - low confidence
        createSignal({ confidence: 90, risk: 'extreme' }), // reject - extreme risk
        createSignal({ confidence: 70, action: 'sell' }), // reject - not actionable
      ];

      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: batch }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.received).toBe(5);
      expect(data.queued).toBe(2);
      expect(data.rejected).toBe(3);
    });
  });

  describe('Signal Queue Operations', () => {
    it('GET /signals/queue returns queued signals', async () => {
      // Submit a signal first
      const signal = createSignal({ confidence: 65 });
      await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      // Check queue
      const res = await fetch(`${API_URL}/signals/queue`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.signals)).toBe(true);
    });

    it('GET /signals/{id} retrieves signal status', async () => {
      const signalId = generateSignalId();
      const signal = createSignal({ id: signalId, confidence: 65 });

      await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      const res = await fetch(`${API_URL}/signals/${signalId}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.signal.id).toBe(signalId);
      expect(data.status).toBe('queued');
    });

    it('returns 404 for non-existent signal', async () => {
      const res = await fetch(`${API_URL}/signals/non-existent-id-12345`);
      expect(res.status).toBe(404);
    });

    it('DELETE /signals/queue clears the queue', async () => {
      // Submit signals
      const signals = [createSignal(), createSignal(), createSignal()];
      await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals }),
      });

      // Verify queue has signals
      let queueRes = await fetch(`${API_URL}/signals/queue`);
      let queueData = await queueRes.json();
      expect(queueData.count).toBeGreaterThanOrEqual(3);

      // Clear queue
      const clearRes = await fetchWithAuth('/signals/queue', {
        method: 'DELETE',
      });
      expect(clearRes.status).toBe(200);

      const clearData = await clearRes.json();
      expect(clearData.cleared).toBeGreaterThanOrEqual(3);

      // Verify queue is empty
      queueRes = await fetch(`${API_URL}/signals/queue`);
      queueData = await queueRes.json();
      expect(queueData.count).toBe(0);
    });
  });

  describe('Batch Limits', () => {
    it('accepts batch up to 100 signals', async () => {
      const signals = Array.from({ length: 100 }, () =>
        createSignal({ confidence: 65 })
      );

      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(100);
    });

    it('rejects batch exceeding 100 signals', async () => {
      const signals = Array.from({ length: 101 }, () =>
        createSignal({ confidence: 65 })
      );

      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals }),
      });

      // Should be 422 validation error
      expect(res.status).toBe(422);
    });
  });
});
