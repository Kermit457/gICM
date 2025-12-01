/**
 * API Authentication Integration Tests
 *
 * Tests X-API-Key authentication on protected endpoints.
 * Requires Python backend running: uvicorn src.api.app:app
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { validSignal, createSignal } from '../fixtures/signals';

const API_URL = process.env.API_URL || 'http://localhost:8000/api/v1';
const VALID_API_KEY = process.env.GICM_API_KEY || 'test-api-key-12345';
const INVALID_API_KEY = 'invalid-key-xxxxx';

// Helper to make authenticated requests
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  apiKey?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

describe('API Authentication', () => {
  // Skip tests if backend is not running
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

  describe('Protected Endpoints - Require X-API-Key', () => {
    it('POST /analyze rejects request without API key', async () => {
      const res = await fetchWithAuth('/analyze', {
        method: 'POST',
        body: JSON.stringify({ token: 'SOL', chain: 'solana' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.detail).toContain('API key');
    });

    it('POST /analyze rejects request with invalid API key', async () => {
      const res = await fetchWithAuth(
        '/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ token: 'SOL', chain: 'solana' }),
        },
        INVALID_API_KEY
      );

      expect(res.status).toBe(403);
    });

    it('POST /analyze accepts request with valid API key', async () => {
      const res = await fetchWithAuth(
        '/analyze',
        {
          method: 'POST',
          body: JSON.stringify({ token: 'SOL', chain: 'solana', mode: 'fast' }),
        },
        VALID_API_KEY
      );

      // Should not be 403 (may be 200 or 500 depending on backend state)
      expect(res.status).not.toBe(403);
    });

    it('POST /positions requires authentication', async () => {
      const res = await fetchWithAuth('/positions', {
        method: 'POST',
        body: JSON.stringify({ token: 'TEST', size: 100 }),
      });

      expect(res.status).toBe(403);
    });

    it('DELETE /positions/{token} requires authentication', async () => {
      const res = await fetchWithAuth('/positions/TEST', {
        method: 'DELETE',
      });

      expect(res.status).toBe(403);
    });

    it('POST /signals requires authentication', async () => {
      const signal = createSignal();
      const res = await fetchWithAuth('/signals', {
        method: 'POST',
        body: JSON.stringify({ signals: [signal] }),
      });

      expect(res.status).toBe(403);
    });

    it('POST /mode requires authentication', async () => {
      const res = await fetchWithAuth('/mode', {
        method: 'POST',
        body: JSON.stringify({ mode: 'paper' }),
      });

      expect(res.status).toBe(403);
    });

    it('DELETE /signals/queue requires authentication', async () => {
      const res = await fetchWithAuth('/signals/queue', {
        method: 'DELETE',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('Public Endpoints - No Authentication Required', () => {
    it('GET /health works without authentication', async () => {
      const res = await fetchWithAuth('/health', { method: 'GET' });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
    });

    it('GET /status works without authentication', async () => {
      const res = await fetchWithAuth('/status', { method: 'GET' });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('mode');
    });

    it('GET /agents works without authentication', async () => {
      const res = await fetchWithAuth('/agents', { method: 'GET' });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('GET /positions works without authentication (read-only)', async () => {
      const res = await fetchWithAuth('/positions', { method: 'GET' });

      expect(res.status).toBe(200);
    });

    it('GET /mode works without authentication', async () => {
      const res = await fetchWithAuth('/mode', { method: 'GET' });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('mode');
    });

    it('GET /signals/queue works without authentication (read-only)', async () => {
      const res = await fetchWithAuth('/signals/queue', { method: 'GET' });

      expect(res.status).toBe(200);
    });
  });
});
