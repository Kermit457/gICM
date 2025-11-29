/**
 * Suggestion Panel - Shows gICM component suggestions
 */

import type { GICMSuggestion } from "../types.js";
import { ELEMENT_ID, SUGGESTION_PANEL_DURATION } from "../constants.js";

export class SuggestionPanel {
  private element: HTMLDivElement | null = null;
  private hideTimeout: number | null = null;

  show(suggestions: GICMSuggestion[]): void {
    this.hide();

    if (suggestions.length === 0) return;

    this.element = this.createElement(suggestions);
    document.body.appendChild(this.element);

    // Auto-hide after duration
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, SUGGESTION_PANEL_DURATION);
  }

  hide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  destroy(): void {
    this.hide();
  }

  private createElement(suggestions: GICMSuggestion[]): HTMLDivElement {
    const el = document.createElement("div");
    el.id = ELEMENT_ID.SUGGESTION_PANEL;

    el.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-height: 400px;
        background: #1a1a2e;
        border: 1px solid #7c3aed;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 2147483647;
        overflow: hidden;
        animation: gicm-slide-in 0.3s ease-out;
      ">
        <div style="
          padding: 12px 16px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>gICM Components</span>
          <button
            onclick="this.closest('#${ELEMENT_ID.SUGGESTION_PANEL}').remove()"
            style="
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 18px;
              line-height: 1;
              padding: 0;
            "
          >×</button>
        </div>
        <div style="padding: 12px; overflow-y: auto; max-height: 320px;">
          ${suggestions.map((s) => this.renderSuggestion(s)).join("")}
        </div>
        <div style="
          padding: 8px 16px;
          background: #2a2a3e;
          font-size: 11px;
          color: #888;
          text-align: center;
        ">
          Click to copy ID - Paste in Claude Code
        </div>
      </div>
    `;

    // Add click handlers
    el.querySelectorAll("[data-gicm-id]").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-gicm-id");
        navigator.clipboard.writeText(`gicm:${id}`);

        const badge = item.querySelector(".copy-badge") as HTMLElement;
        if (badge) {
          badge.textContent = "Copied!";
          badge.style.background = "#10b981";
        }
      });
    });

    return el;
  }

  private renderSuggestion(s: GICMSuggestion): string {
    const score = Math.round(s.similarity_score * 100);

    return `
      <div
        data-gicm-id="${s.id}"
        style="
          padding: 12px;
          margin-bottom: 8px;
          background: #2a2a3e;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        "
        onmouseover="this.style.background='#3a3a4e'"
        onmouseout="this.style.background='#2a2a3e'"
      >
        <div style="
          font-weight: 600;
          color: #e0e0e0;
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>${s.name}</span>
          <span class="copy-badge" style="
            font-size: 10px;
            padding: 2px 6px;
            background: #4a4a5e;
            border-radius: 4px;
            font-weight: normal;
          ">Copy ID</span>
        </div>
        <div style="
          font-size: 12px;
          color: #a0a0a0;
          margin-bottom: 8px;
          line-height: 1.4;
        ">${s.description.slice(0, 80)}${s.description.length > 80 ? "..." : ""}</div>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="
            font-size: 11px;
            padding: 2px 8px;
            background: #7c3aed;
            color: white;
            border-radius: 4px;
          ">${s.category}</span>
          <span style="
            font-size: 11px;
            color: ${score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#6b7280"};
            font-weight: 500;
          ">${score}% match</span>
        </div>
      </div>
    `;
  }
}
