"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface NotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body text */
  body?: string;
  /** Notification icon URL */
  icon?: string;
  /** Notification tag for grouping/replacing */
  tag?: string;
  /** Whether to require interaction to dismiss */
  requireInteraction?: boolean;
  /** Play sound alert */
  sound?: boolean;
  /** Click callback */
  onClick?: () => void;
}

export interface UseNotificationsOptions {
  /** Auto-request permission on mount */
  autoRequest?: boolean;
  /** Default icon for notifications */
  defaultIcon?: string;
  /** Whether to enable sound by default */
  enableSound?: boolean;
}

const DEFAULT_OPTIONS: UseNotificationsOptions = {
  autoRequest: false,
  defaultIcon: "/gicm-icon.png",
  enableSound: true,
};

// Sound for notifications
let audioContext: AudioContext | null = null;

function playNotificationSound() {
  try {
    // Create audio context lazily
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    // Create a simple beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880; // A5 note
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.warn("Failed to play notification sound:", err);
  }
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const notificationRef = useRef<Notification | null>(null);

  // Check support and get current permission
  useEffect(() => {
    const isSupported = "Notification" in window;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission as NotificationPermission);
      setEnabled(Notification.permission === "granted");

      // Auto-request if configured
      if (opts.autoRequest && Notification.permission === "default") {
        requestPermission();
      }
    }
  }, [opts.autoRequest]);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      console.warn("Notifications not supported in this browser");
      return false;
    }

    if (permission === "granted") {
      return true;
    }

    if (permission === "denied") {
      console.warn("Notification permission was denied");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      setEnabled(result === "granted");
      return result === "granted";
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      return false;
    }
  }, [supported, permission]);

  const notify = useCallback(
    (options: NotificationOptions) => {
      if (!supported || permission !== "granted") {
        console.warn("Notifications not available");
        return null;
      }

      // Play sound if enabled
      if ((options.sound ?? opts.enableSound) && opts.enableSound) {
        playNotificationSound();
      }

      try {
        // Close previous notification with same tag
        if (options.tag && notificationRef.current?.tag === options.tag) {
          notificationRef.current.close();
        }

        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon ?? opts.defaultIcon,
          tag: options.tag,
          requireInteraction: options.requireInteraction ?? false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          options.onClick?.();
        };

        notificationRef.current = notification;
        return notification;
      } catch (err) {
        console.error("Failed to create notification:", err);
        return null;
      }
    },
    [supported, permission, opts.defaultIcon, opts.enableSound]
  );

  // Convenience methods for common notification types
  const notifyBrainStatus = useCallback(
    (status: "started" | "stopped" | "phase_changed", details?: string) => {
      const titles = {
        started: "Brain Started",
        stopped: "Brain Stopped",
        phase_changed: "Brain Phase Changed",
      };

      return notify({
        title: titles[status],
        body: details ?? `gICM Brain is now ${status.replace("_", " ")}`,
        tag: "brain-status",
        icon: "/brain-icon.png",
      });
    },
    [notify]
  );

  const notifyPipelineComplete = useCallback(
    (pipelineName: string, success: boolean) => {
      return notify({
        title: success ? "Pipeline Completed" : "Pipeline Failed",
        body: `${pipelineName} ${success ? "finished successfully" : "encountered an error"}`,
        tag: `pipeline-${pipelineName}`,
        icon: success ? "/success-icon.png" : "/error-icon.png",
      });
    },
    [notify]
  );

  const notifyHighRisk = useCallback(
    (action: string, riskLevel: number) => {
      return notify({
        title: "High Risk Action Detected",
        body: `${action} - Risk level: ${riskLevel}%`,
        tag: "high-risk",
        requireInteraction: true,
        sound: true,
      });
    },
    [notify]
  );

  const notifyTrade = useCallback(
    (type: "buy" | "sell", asset: string, amount: number) => {
      return notify({
        title: `Trade ${type === "buy" ? "Executed" : "Completed"}`,
        body: `${type.toUpperCase()} ${amount} ${asset}`,
        tag: `trade-${Date.now()}`,
      });
    },
    [notify]
  );

  const notifyDiscovery = useCallback(
    (title: string, source: string) => {
      return notify({
        title: "New Discovery",
        body: `${title} from ${source}`,
        tag: "discovery",
      });
    },
    [notify]
  );

  // Close all notifications
  const closeAll = useCallback(() => {
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  }, []);

  return {
    supported,
    permission,
    enabled,
    requestPermission,
    notify,
    // Convenience methods
    notifyBrainStatus,
    notifyPipelineComplete,
    notifyHighRisk,
    notifyTrade,
    notifyDiscovery,
    closeAll,
  };
}

/**
 * Hook to store notification preferences in localStorage
 */
export function useNotificationPreferences() {
  const STORAGE_KEY = "gicm-notification-prefs";

  const [preferences, setPreferences] = useState({
    enabled: true,
    sound: true,
    brainAlerts: true,
    pipelineAlerts: true,
    highRiskAlerts: true,
    tradeAlerts: false,
    discoveryAlerts: false,
  });

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch {
        // Invalid data, use defaults
      }
    }
  }, []);

  // Save to localStorage
  const updatePreferences = useCallback(
    (updates: Partial<typeof preferences>) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
        return newPrefs;
      });
    },
    []
  );

  return {
    preferences,
    updatePreferences,
  };
}
