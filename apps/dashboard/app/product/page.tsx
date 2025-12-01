"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ConnectionIndicator } from "@/components/ConnectionIndicator";
import {
  Package,
  Lightbulb,
  Hammer,
  CheckCircle,
  Clock,
  XCircle,
  Rocket,
  BarChart3,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { hubApi, type ProductStatus } from "../../lib/api/hub";

function BacklogCard({ product }: { product: ProductStatus | null }) {
  const backlog = product?.backlog ?? { total: 0, approved: 0, building: 0 };
  const pending = backlog.total - backlog.approved - backlog.building;

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-gicm-primary" />
        Opportunity Backlog
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="text-3xl font-bold text-yellow-400">{pending}</div>
          <div className="text-xs text-gray-400 mt-1">Pending Review</div>
        </div>
        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-3xl font-bold text-green-400">{backlog.approved}</div>
          <div className="text-xs text-gray-400 mt-1">Approved</div>
        </div>
        <div className="text-center p-4 bg-gicm-primary/10 border border-gicm-primary/30 rounded-lg">
          <div className="text-3xl font-bold text-gicm-primary">{backlog.building}</div>
          <div className="text-xs text-gray-400 mt-1">Building</div>
        </div>
      </div>
    </div>
  );
}

function ActiveBuildCard({ product }: { product: ProductStatus | null }) {
  const build = product?.activeBuild;

  if (!build) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Hammer className="w-5 h-5 text-gicm-primary" />
          Active Build
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No active build</p>
          <p className="text-sm text-gray-500 mt-2">Waiting for next approved opportunity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Hammer className="w-5 h-5 text-gicm-primary animate-pulse" />
        Active Build
      </h3>
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold">{build.name}</div>
          <div className="text-sm text-gray-400">{build.id}</div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-gicm-primary">{build.progress}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gicm-primary transition-all duration-500"
              style={{ width: `${build.progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gicm-primary">
          <div className="w-2 h-2 bg-gicm-primary rounded-full animate-pulse" />
          Building...
        </div>
      </div>
    </div>
  );
}

function MetricsCard({ product }: { product: ProductStatus | null }) {
  const metrics = product?.metrics ?? { discovered: 0, built: 0, deployed: 0, successRate: 0 };

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gicm-primary" />
        Lifetime Metrics
      </h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{metrics.discovered}</div>
          <div className="text-xs text-gray-400 mt-1">Discovered</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gicm-primary">{metrics.built}</div>
          <div className="text-xs text-gray-400 mt-1">Built</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{metrics.deployed}</div>
          <div className="text-xs text-gray-400 mt-1">Deployed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{metrics.successRate.toFixed(0)}%</div>
          <div className="text-xs text-gray-400 mt-1">Success Rate</div>
        </div>
      </div>
    </div>
  );
}

function PipelineVisualization({ product }: { product: ProductStatus | null }) {
  const stages = [
    { name: "Discover", icon: Lightbulb, count: product?.metrics?.discovered ?? 0, color: "text-blue-400" },
    { name: "Evaluate", icon: BarChart3, count: product?.backlog?.total ?? 0, color: "text-yellow-400" },
    { name: "Build", icon: Hammer, count: product?.backlog?.building ?? 0, color: "text-gicm-primary" },
    { name: "Deploy", icon: Rocket, count: product?.metrics?.deployed ?? 0, color: "text-green-400" },
  ];

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-gicm-primary" />
        Product Pipeline
      </h3>
      <div className="flex items-center justify-between">
        {stages.map((stage, idx) => (
          <div key={stage.name} className="flex items-center">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 ${stage.color}`}>
                <stage.icon className="w-8 h-8" />
              </div>
              <div className="text-sm font-medium">{stage.name}</div>
              <div className={`text-2xl font-bold ${stage.color}`}>{stage.count}</div>
            </div>
            {idx < stages.length - 1 && (
              <ArrowRight className="w-6 h-6 text-gray-500 mx-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickStats({ product }: { product: ProductStatus | null }) {
  const total = product?.backlog?.total ?? 0;
  const building = product?.backlog?.building ?? 0;
  const deployed = product?.metrics?.deployed ?? 0;
  const successRate = product?.metrics?.successRate ?? 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Backlog</div>
        <div className="text-2xl font-bold text-yellow-400">{total}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Building</div>
        <div className="text-2xl font-bold text-gicm-primary">{building}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Deployed</div>
        <div className="text-2xl font-bold text-green-400">{deployed}</div>
      </div>
      <div className="bg-gicm-card border border-gicm-border rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Success Rate</div>
        <div className="text-2xl font-bold text-purple-400">{successRate.toFixed(0)}%</div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const ws = useWebSocket({
    autoReconnect: true,
    reconnectDelay: 3000,
    onEvent: (event) => {
      if (event.type?.includes("product") || event.type?.includes("build") || event.type?.includes("discovery")) {
        fetchData();
      }
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await hubApi.getProduct().catch(() => null);
    setProduct(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  // Adaptive polling based on WebSocket connection
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const interval = ws.isConnected ? 30000 : 10000;
    pollingRef.current = setInterval(fetchData, interval);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [ws.isConnected, fetchData]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Product...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-gicm-primary" />
            Product Engine
          </h1>
          <p className="text-gray-400 mt-1">Autonomous discovery, building & deployment pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionIndicator status={ws.status} isRealtime={ws.isConnected} compact />
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <QuickStats product={product} />
      <PipelineVisualization product={product} />

      <div className="grid grid-cols-2 gap-6">
        <BacklogCard product={product} />
        <ActiveBuildCard product={product} />
      </div>

      <MetricsCard product={product} />

      {!product && !loading && (
        <div className="bg-gicm-card border border-gicm-border rounded-xl p-6 text-center">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Product Engine not connected</p>
          <p className="text-sm text-gray-500 mt-2">Start the Product Engine to see live data</p>
        </div>
      )}
    </div>
  );
}
