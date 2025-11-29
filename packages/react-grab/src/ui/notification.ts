/**
 * Copy Notification - Shows success message
 */

import { ELEMENT_ID, NOTIFICATION_DURATION } from "../constants.js";

export function showNotification(message: string): void {
  // Remove existing
  const existing = document.getElementById(ELEMENT_ID.NOTIFICATION);
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = ELEMENT_ID.NOTIFICATION;
  el.textContent = message;

  el.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: gicm-slide-in 0.3s ease-out;
  `;

  // Add animation keyframes if not exists
  if (!document.getElementById("gicm-grab-styles")) {
    const style = document.createElement("style");
    style.id = "gicm-grab-styles";
    style.textContent = `
      @keyframes gicm-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes gicm-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(el);

  // Remove after duration
  setTimeout(() => {
    el.style.animation = "gicm-fade-out 0.3s ease-out forwards";
    setTimeout(() => el.remove(), 300);
  }, NOTIFICATION_DURATION);
}
