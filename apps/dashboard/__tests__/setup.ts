import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const React = require("react");
    return React.createElement("a", { href }, children);
  },
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event("open"));
    }, 10);
  }

  send(data: string) {
    // Mock send - do nothing
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close", { code: code ?? 1000, reason }));
  }

  // Helper to simulate receiving a message
  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }));
  }
}

// @ts-expect-error - Mocking WebSocket
global.WebSocket = MockWebSocket;

// Mock Notification API
class MockNotification {
  static permission: NotificationPermission = "default";

  static requestPermission(): Promise<NotificationPermission> {
    MockNotification.permission = "granted";
    return Promise.resolve("granted");
  }

  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  onclick: ((event: Event) => void) | null = null;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.body = options?.body;
    this.icon = options?.icon;
    this.tag = options?.tag;
  }

  close() {}
}

// @ts-expect-error - Mocking Notification
global.Notification = MockNotification;

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock Audio Context for notification sounds
const mockAudioContext = {
  createOscillator: () => ({
    connect: vi.fn(),
    frequency: { value: 440 },
    type: "sine",
    start: vi.fn(),
    stop: vi.fn(),
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  }),
  destination: {},
  currentTime: 0,
};

// @ts-expect-error - Mocking AudioContext
global.AudioContext = vi.fn(() => mockAudioContext);
// @ts-expect-error - Mocking webkitAudioContext
global.webkitAudioContext = vi.fn(() => mockAudioContext);

// Mock crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2),
  },
});

// Clear localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
  MockNotification.permission = "default";
});
