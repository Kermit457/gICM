"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Webhook,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
} from "lucide-react";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || "http://localhost:3001";

// Webhook types
interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: "pending" | "success" | "failed";
  statusCode?: number;
  response?: string;
  error?: string;
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
}

const EVENT_TYPES = [
  { id: "pipeline.started", label: "Pipeline Started", description: "When a pipeline execution begins" },
  { id: "pipeline.completed", label: "Pipeline Completed", description: "When a pipeline finishes successfully" },
  { id: "pipeline.failed", label: "Pipeline Failed", description: "When a pipeline fails" },
  { id: "cost.alert", label: "Cost Alert", description: "When spending exceeds threshold" },
  { id: "daily.summary", label: "Daily Summary", description: "Daily execution summary report" },
];

const STATUS_STYLES = {
  success: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle2 },
  failed: { bg: "bg-red-500/20", text: "text-red-400", icon: XCircle },
  pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Clock },
};

function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onTest,
  onToggle,
}: {
  webhook: WebhookConfig;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggle: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const copySecret = () => {
    if (webhook.secret) {
      navigator.clipboard.writeText(webhook.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-gicm-card border rounded-xl p-5 transition-all ${
      webhook.enabled ? "border-gicm-border" : "border-gicm-border/50 opacity-60"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${webhook.enabled ? "bg-gicm-primary/20" : "bg-gray-500/20"}`}>
            <Webhook className={`w-5 h-5 ${webhook.enabled ? "text-gicm-primary" : "text-gray-400"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              {webhook.name}
              {!webhook.enabled && (
                <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                  Disabled
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-[300px]">{webhook.url}</p>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-gicm-card border border-gicm-border rounded-lg shadow-xl py-1">
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => { onTest(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  <Send className="w-4 h-4" />
                  Test
                </button>
                <button
                  onClick={() => { onToggle(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  {webhook.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {webhook.enabled ? "Disable" : "Enable"}
                </button>
                <hr className="border-gicm-border my-1" />
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Subscribed Events</p>
        <div className="flex flex-wrap gap-1.5">
          {webhook.events.map((event) => (
            <span
              key={event}
              className="px-2 py-0.5 text-xs bg-gicm-primary/10 text-gicm-primary rounded-full"
            >
              {event}
            </span>
          ))}
        </div>
      </div>

      {/* Secret */}
      {webhook.secret && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Signing Secret</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-1.5 bg-black/30 rounded text-xs text-gray-400 font-mono">
              {showSecret ? webhook.secret : "••••••••••••••••"}
            </code>
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              {showSecret ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={copySecret}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gicm-border">
        <span>Created {new Date(webhook.createdAt).toLocaleDateString()}</span>
        <span>Updated {new Date(webhook.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function WebhookForm({
  webhook,
  onSave,
  onCancel,
}: {
  webhook?: WebhookConfig;
  onSave: (data: Partial<WebhookConfig>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(webhook?.name || "");
  const [url, setUrl] = useState(webhook?.url || "");
  const [secret, setSecret] = useState(webhook?.secret || "");
  const [events, setEvents] = useState<string[]>(webhook?.events || ["pipeline.completed", "pipeline.failed"]);
  const [enabled, setEnabled] = useState(webhook?.enabled !== false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!url.trim()) newErrors.url = "URL is required";
    else if (!url.startsWith("http://") && !url.startsWith("https://")) {
      newErrors.url = "URL must start with http:// or https://";
    }
    if (events.length === 0) newErrors.events = "Select at least one event";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ name, url, secret: secret || undefined, events, enabled });
  };

  const toggleEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const generateSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "whsec_";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecret(result);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Webhook Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Slack Notifications"
          className={`w-full px-4 py-2.5 bg-black/30 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary ${
            errors.name ? "border-red-500" : "border-gicm-border"
          }`}
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Endpoint URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhook"
          className={`w-full px-4 py-2.5 bg-black/30 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary ${
            errors.url ? "border-red-500" : "border-gicm-border"
          }`}
        />
        {errors.url && <p className="text-red-400 text-xs mt-1">{errors.url}</p>}
      </div>

      {/* Secret */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Signing Secret <span className="text-gray-500">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="whsec_..."
            className="flex-1 px-4 py-2.5 bg-black/30 border border-gicm-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gicm-primary font-mono text-sm"
          />
          <button
            type="button"
            onClick={generateSecret}
            className="px-4 py-2 border border-gicm-border rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
          >
            Generate
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Used to sign payloads with HMAC-SHA256 for verification
        </p>
      </div>

      {/* Events */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Events to Subscribe
        </label>
        <div className="space-y-2">
          {EVENT_TYPES.map((event) => (
            <label
              key={event.id}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                events.includes(event.id)
                  ? "border-gicm-primary/50 bg-gicm-primary/5"
                  : "border-gicm-border hover:bg-white/5"
              }`}
            >
              <input
                type="checkbox"
                checked={events.includes(event.id)}
                onChange={() => toggleEvent(event.id)}
                className="mt-0.5 accent-gicm-primary"
              />
              <div>
                <p className="text-sm text-white font-medium">{event.label}</p>
                <p className="text-xs text-gray-500">{event.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.events && <p className="text-red-400 text-xs mt-1">{errors.events}</p>}
      </div>

      {/* Enabled */}
      <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
        <div>
          <p className="text-sm font-medium text-white">Enable Webhook</p>
          <p className="text-xs text-gray-500">Start receiving events immediately</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`w-12 h-6 rounded-full transition-colors ${
            enabled ? "bg-gicm-primary" : "bg-gray-600"
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gicm-primary text-black rounded-lg font-medium hover:bg-gicm-primary/90 transition-colors"
        >
          <Check className="w-4 h-4" />
          {webhook ? "Update Webhook" : "Create Webhook"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gicm-border text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeliveryLog({ webhookId }: { webhookId?: string }) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    setDeliveries([
      {
        id: "del_1",
        webhookId: "wh_1",
        event: "pipeline.completed",
        status: "success",
        statusCode: 200,
        attempts: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: "del_2",
        webhookId: "wh_1",
        event: "pipeline.failed",
        status: "failed",
        statusCode: 500,
        error: "Connection timeout",
        attempts: 3,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "del_3",
        webhookId: "wh_1",
        event: "cost.alert",
        status: "success",
        statusCode: 200,
        attempts: 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ]);
    setLoading(false);
  }, [webhookId]);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
        Loading deliveries...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => {
        const style = STATUS_STYLES[delivery.status];
        const Icon = style.icon;

        return (
          <div
            key={delivery.id}
            className="flex items-center justify-between p-3 bg-black/20 border border-gicm-border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${style.bg}`}>
                <Icon className={`w-4 h-4 ${style.text}`} />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{delivery.event}</p>
                <p className="text-xs text-gray-500">
                  {new Date(delivery.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${style.text}`}>
                {delivery.statusCode || delivery.status}
              </p>
              <p className="text-xs text-gray-500">
                {delivery.attempts} attempt{delivery.attempts !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | undefined>();
  const [activeTab, setActiveTab] = useState<"webhooks" | "deliveries">("webhooks");

  // Fetch webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch(`${HUB_URL}/api/webhooks`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setWebhooks(data.webhooks);
        }
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
      // Use mock data for demo
      setWebhooks([
        {
          id: "wh_1",
          name: "Slack Notifications",
          url: "https://hooks.slack.com/services/xxx/yyy/zzz",
          secret: "whsec_abc123xyz",
          events: ["pipeline.completed", "pipeline.failed", "cost.alert"],
          enabled: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          id: "wh_2",
          name: "Discord Bot",
          url: "https://discord.com/api/webhooks/xxx/yyy",
          events: ["pipeline.completed"],
          enabled: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: "wh_3",
          name: "Analytics Backend",
          url: "https://api.myapp.com/webhooks/gicm",
          secret: "whsec_def456abc",
          events: ["daily.summary"],
          enabled: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // Save webhook
  const handleSave = async (data: Partial<WebhookConfig>) => {
    try {
      if (editingWebhook) {
        // Update
        await fetch(`${HUB_URL}/api/webhooks/${editingWebhook.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Create
        await fetch(`${HUB_URL}/api/webhooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to save webhook:", error);
    }
    setShowForm(false);
    setEditingWebhook(undefined);
  };

  // Delete webhook
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await fetch(`${HUB_URL}/api/webhooks/${id}`, { method: "DELETE" });
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  // Test webhook
  const handleTest = async (id: string) => {
    try {
      await fetch(`${HUB_URL}/api/webhooks/${id}/test`, { method: "POST" });
      alert("Test payload sent!");
    } catch (error) {
      console.error("Failed to test webhook:", error);
      alert("Failed to send test payload");
    }
  };

  // Toggle webhook
  const handleToggle = async (webhook: WebhookConfig) => {
    try {
      await fetch(`${HUB_URL}/api/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !webhook.enabled }),
      });
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gicm-bg text-white">
      {/* Header */}
      <div className="border-b border-gicm-border bg-gicm-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/pipelines"
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Webhook className="w-7 h-7 text-gicm-primary" />
                  Webhooks
                </h1>
                <p className="text-gray-400 text-sm">
                  Configure webhook endpoints for pipeline notifications
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gicm-primary text-black rounded-lg font-medium hover:bg-gicm-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Webhook
              </button>
            )}
          </div>

          {/* Tabs */}
          {!showForm && (
            <div className="flex gap-4 border-t border-gicm-border pt-4">
              <button
                onClick={() => setActiveTab("webhooks")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "webhooks"
                    ? "text-gicm-primary border-b-2 border-gicm-primary"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Endpoints ({webhooks.length})
              </button>
              <button
                onClick={() => setActiveTab("deliveries")}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === "deliveries"
                    ? "text-gicm-primary border-b-2 border-gicm-primary"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Delivery Log
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Form */}
        {showForm ? (
          <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">
              {editingWebhook ? "Edit Webhook" : "Create New Webhook"}
            </h2>
            <WebhookForm
              webhook={editingWebhook}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingWebhook(undefined);
              }}
            />
          </div>
        ) : (
          <>
            {/* Webhooks Tab */}
            {activeTab === "webhooks" && (
              <>
                {loading ? (
                  <div className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                    Loading webhooks...
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gicm-card flex items-center justify-center">
                      <Webhook className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No webhooks configured</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Create a webhook to receive notifications about pipeline events
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-4 py-2 bg-gicm-primary text-black rounded-lg font-medium hover:bg-gicm-primary/90 transition-colors"
                    >
                      Create First Webhook
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {webhooks.map((webhook) => (
                      <WebhookCard
                        key={webhook.id}
                        webhook={webhook}
                        onEdit={() => {
                          setEditingWebhook(webhook);
                          setShowForm(true);
                        }}
                        onDelete={() => handleDelete(webhook.id)}
                        onTest={() => handleTest(webhook.id)}
                        onToggle={() => handleToggle(webhook)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Deliveries Tab */}
            {activeTab === "deliveries" && (
              <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Deliveries</h3>
                  <button
                    onClick={() => {}}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <DeliveryLog />
              </div>
            )}
          </>
        )}

        {/* Info Card */}
        {!showForm && activeTab === "webhooks" && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-400 mb-1">Webhook Security</h4>
                <p className="text-xs text-gray-400">
                  All webhook payloads are signed with HMAC-SHA256 using your secret key.
                  Verify the <code className="text-blue-300">X-GICM-Signature</code> header to ensure authenticity.
                  Failed deliveries are retried up to 3 times with exponential backoff.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
