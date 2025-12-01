/**
 * Zustand Store for Dashboard State
 */

import { create } from "zustand";
import { api, type BrainStatus, type EngineHealth, type HubEvent, type TreasuryStatus } from "./api";

interface DashboardState {
  // Connection
  connected: boolean;
  setConnected: (connected: boolean) => void;

  // Brain
  brainStatus: BrainStatus | null;
  fetchBrainStatus: () => Promise<void>;

  // Engines
  engines: EngineHealth[];
  fetchEngines: () => Promise<void>;

  // Treasury
  treasury: TreasuryStatus | null;
  fetchTreasury: () => Promise<void>;

  // Events
  events: HubEvent[];
  addEvent: (event: HubEvent) => void;
  fetchEvents: () => Promise<void>;

  // Loading states
  loading: {
    brain: boolean;
    engines: boolean;
    treasury: boolean;
    events: boolean;
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Connection
  connected: false,
  setConnected: (connected) => set({ connected }),

  // Brain
  brainStatus: null,
  fetchBrainStatus: async () => {
    set((s) => ({ loading: { ...s.loading, brain: true } }));
    try {
      const res = await api.getBrainStatus();
      if (res.ok) {
        set({ brainStatus: res.status });
      }
    } catch (e) {
      console.error("Failed to fetch brain status:", e);
    } finally {
      set((s) => ({ loading: { ...s.loading, brain: false } }));
    }
  },

  // Engines
  engines: [],
  fetchEngines: async () => {
    set((s) => ({ loading: { ...s.loading, engines: true } }));
    try {
      const res = await api.getStatus();
      if (res.ok) {
        set({ engines: res.engines.details, connected: true });
      }
    } catch (e) {
      console.error("Failed to fetch engines:", e);
      set({ connected: false });
    } finally {
      set((s) => ({ loading: { ...s.loading, engines: false } }));
    }
  },

  // Treasury
  treasury: null,
  fetchTreasury: async () => {
    set((s) => ({ loading: { ...s.loading, treasury: true } }));
    try {
      const res = await api.getTreasury();
      if (res.ok) {
        set({ treasury: res.treasury });
      }
    } catch (e) {
      console.error("Failed to fetch treasury:", e);
    } finally {
      set((s) => ({ loading: { ...s.loading, treasury: false } }));
    }
  },

  // Events
  events: [],
  addEvent: (event) => {
    set((s) => ({
      events: [event, ...s.events].slice(0, 100),
    }));
  },
  fetchEvents: async () => {
    set((s) => ({ loading: { ...s.loading, events: true } }));
    try {
      const res = await api.getEvents(50);
      if (res.ok) {
        set({ events: res.events });
      }
    } catch (e) {
      console.error("Failed to fetch events:", e);
    } finally {
      set((s) => ({ loading: { ...s.loading, events: false } }));
    }
  },

  // Loading
  loading: {
    brain: false,
    engines: false,
    treasury: false,
    events: false,
  },
}));
