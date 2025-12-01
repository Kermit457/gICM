/**
 * Load Balancer
 * Phase 12A: Multi-Region Traffic Distribution
 */

import type {
  Region,
  RegionConfig,
  LoadBalanceStrategy,
  RouteDecision,
  SessionAffinity,
  HealthCheckResult,
} from "./types.js";

// =============================================================================
// LOAD BALANCER
// =============================================================================

export class LoadBalancer {
  private strategy: LoadBalanceStrategy;
  private regions: Map<Region, RegionConfig> = new Map();
  private healthResults: Map<Region, HealthCheckResult> = new Map();
  private roundRobinIndex: number = 0;
  private connectionCounts: Map<Region, number> = new Map();
  private sessionAffinity: SessionAffinity | null = null;
  private sessionMap: Map<string, Region> = new Map();

  constructor(strategy: LoadBalanceStrategy = "weighted") {
    this.strategy = strategy;
  }

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  setStrategy(strategy: LoadBalanceStrategy): void {
    this.strategy = strategy;
    console.log(`[LB] Strategy set to: ${strategy}`);
  }

  setSessionAffinity(affinity: SessionAffinity | null): void {
    this.sessionAffinity = affinity;
    if (affinity?.enabled) {
      console.log(`[LB] Session affinity enabled (TTL: ${affinity.ttlMs}ms)`);
    }
  }

  addRegion(config: RegionConfig): void {
    this.regions.set(config.region, config);
    this.connectionCounts.set(config.region, 0);
  }

  removeRegion(region: Region): void {
    this.regions.delete(region);
    this.connectionCounts.delete(region);
  }

  updateHealth(region: Region, result: HealthCheckResult): void {
    this.healthResults.set(region, result);
  }

  // ===========================================================================
  // ROUTING DECISION
  // ===========================================================================

  route(options?: {
    clientIp?: string;
    sessionId?: string;
    preferredRegion?: Region;
    excludeRegions?: Region[];
  }): RouteDecision | null {
    const availableRegions = this.getAvailableRegions(options?.excludeRegions);

    if (availableRegions.length === 0) {
      console.warn("[LB] No available regions for routing");
      return null;
    }

    // Check session affinity first
    if (this.sessionAffinity?.enabled && options?.sessionId) {
      const sessionRegion = this.sessionMap.get(options.sessionId);
      if (sessionRegion && availableRegions.includes(sessionRegion)) {
        const config = this.regions.get(sessionRegion)!;
        return {
          region: sessionRegion,
          endpoint: config.endpoint,
          reason: "session_affinity",
          fallbackRegions: this.getFallbackRegions(sessionRegion, availableRegions),
        };
      }
    }

    // Check preferred region
    if (options?.preferredRegion && availableRegions.includes(options.preferredRegion)) {
      const config = this.regions.get(options.preferredRegion)!;
      return {
        region: options.preferredRegion,
        endpoint: config.endpoint,
        reason: "preferred",
        fallbackRegions: this.getFallbackRegions(options.preferredRegion, availableRegions),
      };
    }

    // Apply load balancing strategy
    let selectedRegion: Region;
    let reason: string;

    switch (this.strategy) {
      case "round-robin":
        selectedRegion = this.selectRoundRobin(availableRegions);
        reason = "round_robin";
        break;

      case "weighted":
        selectedRegion = this.selectWeighted(availableRegions);
        reason = "weighted";
        break;

      case "least-connections":
        selectedRegion = this.selectLeastConnections(availableRegions);
        reason = "least_connections";
        break;

      case "latency-based":
        selectedRegion = this.selectLatencyBased(availableRegions);
        reason = "latency_based";
        break;

      case "geo-proximity":
        selectedRegion = this.selectGeoProximity(availableRegions, options?.clientIp);
        reason = "geo_proximity";
        break;

      case "failover":
        selectedRegion = this.selectFailover(availableRegions);
        reason = "failover";
        break;

      default:
        selectedRegion = availableRegions[0];
        reason = "default";
    }

    // Store session affinity
    if (this.sessionAffinity?.enabled && options?.sessionId) {
      this.sessionMap.set(options.sessionId, selectedRegion);
      // Set TTL cleanup
      setTimeout(() => {
        this.sessionMap.delete(options.sessionId!);
      }, this.sessionAffinity.ttlMs);
    }

    const config = this.regions.get(selectedRegion)!;
    return {
      region: selectedRegion,
      endpoint: config.endpoint,
      reason,
      fallbackRegions: this.getFallbackRegions(selectedRegion, availableRegions),
    };
  }

  // ===========================================================================
  // STRATEGY IMPLEMENTATIONS
  // ===========================================================================

  private selectRoundRobin(regions: Region[]): Region {
    const region = regions[this.roundRobinIndex % regions.length];
    this.roundRobinIndex++;
    return region;
  }

  private selectWeighted(regions: Region[]): Region {
    const totalWeight = regions.reduce((sum, r) => {
      const config = this.regions.get(r);
      return sum + (config?.weight ?? 100);
    }, 0);

    let random = Math.random() * totalWeight;

    for (const region of regions) {
      const config = this.regions.get(region);
      const weight = config?.weight ?? 100;
      random -= weight;
      if (random <= 0) {
        return region;
      }
    }

    return regions[0];
  }

  private selectLeastConnections(regions: Region[]): Region {
    let minConnections = Infinity;
    let selectedRegion = regions[0];

    for (const region of regions) {
      const connections = this.connectionCounts.get(region) ?? 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedRegion = region;
      }
    }

    return selectedRegion;
  }

  private selectLatencyBased(regions: Region[]): Region {
    let minLatency = Infinity;
    let selectedRegion = regions[0];

    for (const region of regions) {
      const health = this.healthResults.get(region);
      const latency = health?.latencyMs ?? Infinity;
      if (latency < minLatency) {
        minLatency = latency;
        selectedRegion = region;
      }
    }

    return selectedRegion;
  }

  private selectGeoProximity(regions: Region[], clientIp?: string): Region {
    // Simple geo-proximity based on region prefixes
    // In production, use IP geolocation service
    if (!clientIp) {
      return this.selectLatencyBased(regions);
    }

    // Mock geo-based selection (in production, use MaxMind GeoIP or similar)
    const geoHints: Record<string, Region[]> = {
      "10.": ["us-east-1", "us-west-2"],
      "172.": ["eu-west-1", "eu-central-1"],
      "192.168.": ["ap-southeast-1", "ap-northeast-1"],
    };

    for (const [prefix, preferredRegions] of Object.entries(geoHints)) {
      if (clientIp.startsWith(prefix)) {
        const match = preferredRegions.find(r => regions.includes(r as Region));
        if (match) return match as Region;
      }
    }

    return this.selectLatencyBased(regions);
  }

  private selectFailover(regions: Region[]): Region {
    // Prefer primary region, failover to standby in order
    const primary = Array.from(this.regions.values())
      .filter(r => r.isPrimary && regions.includes(r.region))
      .sort((a, b) => b.weight - a.weight);

    if (primary.length > 0) {
      return primary[0].region;
    }

    // Fall back to highest weight standby
    const standby = Array.from(this.regions.values())
      .filter(r => regions.includes(r.region))
      .sort((a, b) => b.weight - a.weight);

    return standby[0]?.region ?? regions[0];
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private getAvailableRegions(excludeRegions?: Region[]): Region[] {
    const exclude = new Set(excludeRegions ?? []);

    return Array.from(this.regions.values())
      .filter(config => {
        // Exclude specified regions
        if (exclude.has(config.region)) return false;

        // Exclude offline/draining regions
        if (config.status === "offline" || config.status === "draining") return false;

        // Check health
        const health = this.healthResults.get(config.region);
        if (health && !health.healthy) return false;

        return true;
      })
      .map(config => config.region);
  }

  private getFallbackRegions(selected: Region, available: Region[]): Region[] {
    return available
      .filter(r => r !== selected)
      .sort((a, b) => {
        const healthA = this.healthResults.get(a);
        const healthB = this.healthResults.get(b);
        return (healthA?.latencyMs ?? Infinity) - (healthB?.latencyMs ?? Infinity);
      })
      .slice(0, 2);
  }

  // ===========================================================================
  // CONNECTION TRACKING
  // ===========================================================================

  incrementConnections(region: Region): void {
    const current = this.connectionCounts.get(region) ?? 0;
    this.connectionCounts.set(region, current + 1);
  }

  decrementConnections(region: Region): void {
    const current = this.connectionCounts.get(region) ?? 0;
    this.connectionCounts.set(region, Math.max(0, current - 1));
  }

  getConnectionCount(region: Region): number {
    return this.connectionCounts.get(region) ?? 0;
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  getStats(): {
    strategy: LoadBalanceStrategy;
    regionCount: number;
    availableCount: number;
    connectionsByRegion: Record<string, number>;
    sessionCount: number;
  } {
    return {
      strategy: this.strategy,
      regionCount: this.regions.size,
      availableCount: this.getAvailableRegions().length,
      connectionsByRegion: Object.fromEntries(this.connectionCounts),
      sessionCount: this.sessionMap.size,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let loadBalancerInstance: LoadBalancer | null = null;

export function getLoadBalancer(): LoadBalancer {
  if (!loadBalancerInstance) {
    loadBalancerInstance = new LoadBalancer();
  }
  return loadBalancerInstance;
}

export function createLoadBalancer(strategy?: LoadBalanceStrategy): LoadBalancer {
  loadBalancerInstance = new LoadBalancer(strategy);
  return loadBalancerInstance;
}
