"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  X,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Brain,
  Workflow,
  AlertTriangle,
  TrendingUp,
  Target,
} from "lucide-react";
import { useNotifications, useNotificationPreferences } from "../hooks/useNotifications";

interface NotificationBannerProps {
  onDismiss?: () => void;
}

/**
 * Banner to prompt users to enable notifications
 */
export function NotificationBanner({ onDismiss }: NotificationBannerProps) {
  const { supported, permission, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (!supported || permission !== "default" || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    await requestPermission();
    setDismissed(true);
    onDismiss?.();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Enable Notifications</p>
          <p className="text-xs text-gray-400">Get alerts for brain status, pipelines, and high-risk events</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Not now
        </button>
        <button
          onClick={handleEnable}
          className="px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Enable
        </button>
      </div>
    </div>
  );
}

/**
 * Notification status indicator for header
 */
export function NotificationIndicator() {
  const { supported, permission, enabled } = useNotifications();
  const { preferences } = useNotificationPreferences();

  if (!supported) {
    return (
      <div className="flex items-center gap-1.5 text-gray-500" title="Notifications not supported">
        <BellOff className="w-4 h-4" />
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-1.5 text-red-400" title="Notifications blocked">
        <BellOff className="w-4 h-4" />
      </div>
    );
  }

  if (!enabled || !preferences.enabled) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400" title="Notifications disabled">
        <Bell className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-green-400" title="Notifications enabled">
      <Bell className="w-4 h-4" />
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
    </div>
  );
}

/**
 * Full notification settings panel
 */
export function NotificationSettings() {
  const { supported, permission, enabled, requestPermission, notify } = useNotifications();
  const { preferences, updatePreferences } = useNotificationPreferences();
  const [expanded, setExpanded] = useState(false);

  const handleTestNotification = () => {
    notify({
      title: "Test Notification",
      body: "This is a test notification from gICM Dashboard",
      sound: preferences.sound,
    });
  };

  if (!supported) {
    return (
      <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <BellOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Notifications Not Supported</h3>
            <p className="text-sm text-gray-400">Your browser doesn't support notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gicm-card border border-gicm-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${enabled ? "bg-green-500/10" : "bg-gray-500/10"}`}>
            {enabled ? (
              <Bell className="w-5 h-5 text-green-400" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">Notification Settings</h3>
            <p className="text-sm text-gray-400">
              {permission === "denied"
                ? "Notifications are blocked by your browser"
                : enabled
                ? "Receiving desktop notifications"
                : "Enable to get important alerts"}
            </p>
          </div>
        </div>

        {permission !== "denied" && (
          <button
            onClick={() => (enabled ? updatePreferences({ enabled: !preferences.enabled }) : requestPermission())}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              enabled && preferences.enabled
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "bg-gicm-primary text-black"
            }`}
          >
            {enabled && preferences.enabled ? "Enabled" : "Enable"}
          </button>
        )}
      </div>

      {/* Permission denied message */}
      {permission === "denied" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-400">
            Notifications are blocked. To enable them, click the lock icon in your browser's address bar
            and allow notifications for this site.
          </p>
        </div>
      )}

      {/* Settings (only show if enabled) */}
      {enabled && preferences.enabled && (
        <>
          {/* Sound toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gicm-border">
            <div className="flex items-center gap-3">
              {preferences.sound ? (
                <Volume2 className="w-5 h-5 text-gicm-primary" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-white">Sound Alerts</p>
                <p className="text-xs text-gray-500">Play a sound with notifications</p>
              </div>
            </div>
            <button
              onClick={() => updatePreferences({ sound: !preferences.sound })}
              className={`w-12 h-6 rounded-full transition-colors ${
                preferences.sound ? "bg-gicm-primary" : "bg-gray-600"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${
                  preferences.sound ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Expandable alert types */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full py-3 text-left"
          >
            <span className="text-sm font-medium text-white">Alert Types</span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {expanded && (
            <div className="space-y-2 pb-4">
              {/* Brain Alerts */}
              <AlertTypeToggle
                icon={Brain}
                label="Brain Status"
                description="Start, stop, phase changes"
                enabled={preferences.brainAlerts}
                onChange={(v) => updatePreferences({ brainAlerts: v })}
              />

              {/* Pipeline Alerts */}
              <AlertTypeToggle
                icon={Workflow}
                label="Pipeline Alerts"
                description="Completion and failures"
                enabled={preferences.pipelineAlerts}
                onChange={(v) => updatePreferences({ pipelineAlerts: v })}
              />

              {/* High Risk Alerts */}
              <AlertTypeToggle
                icon={AlertTriangle}
                label="High Risk Alerts"
                description="Critical autonomy events"
                enabled={preferences.highRiskAlerts}
                onChange={(v) => updatePreferences({ highRiskAlerts: v })}
              />

              {/* Trade Alerts */}
              <AlertTypeToggle
                icon={TrendingUp}
                label="Trade Alerts"
                description="Buy/sell executions"
                enabled={preferences.tradeAlerts}
                onChange={(v) => updatePreferences({ tradeAlerts: v })}
              />

              {/* Discovery Alerts */}
              <AlertTypeToggle
                icon={Target}
                label="Discovery Alerts"
                description="New opportunities found"
                enabled={preferences.discoveryAlerts}
                onChange={(v) => updatePreferences({ discoveryAlerts: v })}
              />
            </div>
          )}

          {/* Test button */}
          <button
            onClick={handleTestNotification}
            className="w-full mt-4 px-4 py-2 text-sm font-medium bg-white/5 border border-gicm-border rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Send Test Notification
          </button>
        </>
      )}
    </div>
  );
}

// Helper component for alert type toggles
function AlertTypeToggle({
  icon: Icon,
  label,
  description,
  enabled,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${enabled ? "text-gicm-primary" : "text-gray-500"}`} />
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`w-10 h-5 rounded-full transition-colors ${enabled ? "bg-gicm-primary" : "bg-gray-600"}`}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white transform transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
