/**
 * <copy-as-markdown-button> — Web Component
 *
 * Attributes:
 *   selector      CSS selector for the content to capture (default: "main")
 *   label         Text on the trigger button (default: "Copy as Markdown")
 *
 * CSS custom properties (set on the element or a parent):
 *   --copy-md-bg          Button background  (default: #0f0f0f)
 *   --copy-md-fg          Text / icon colour (default: #e2e2e2)
 *   --copy-md-accent      Hover / active accent (default: #ffffff)
 *   --copy-md-border      Border colour (default: #2a2a2a)
 *   --copy-md-font        Font family (default: inherit)
 *   --copy-md-radius      Border radius (default: 6px)
 *
 * Usage:
 *   <copy-as-markdown-button selector="article"></copy-as-markdown-button>
 *
 *   Load Turndown before this file, or let the component load it lazily:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js"></script>
 *   <script src="copy-as-markdown-button.js" type="module"></script>
 */

const TURNDOWN_CDN = "https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js";

const ICONS = {
  copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
};

const STYLES = `
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--copy-md-font, inherit);
    --bg:      var(--copy-md-bg, #0f0f0f);
    --fg:      var(--copy-md-fg, #e2e2e2);
    --accent:  var(--copy-md-accent, #ffffff);
    --border:  var(--copy-md-border, #2a2a2a);
    --radius:  var(--copy-md-radius, 6px);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 12px;
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
    white-space: nowrap;
    user-select: none;
  }

  .trigger:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .trigger-icon {
    opacity: 0.6;
    display: flex;
    align-items: center;
  }

  /* Status toast */
  .toast {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: var(--bg);
    border: 1px solid var(--accent);
    color: var(--accent);
    border-radius: var(--radius);
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(-4px);
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toast.show {
    opacity: 1;
    transform: translateY(0);
  }
`;

class CopyAsMarkdownButton extends HTMLElement {
  static get observedAttributes() {
    return ["label", "selector"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._markdown = null;
  }

  get _selector() {
    return this.getAttribute("selector") || "main";
  }

  get _label() {
    return this.getAttribute("label") || "Copy as Markdown";
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <button class="trigger">
        <span class="trigger-icon">${ICONS.copy}</span>
        <span>${this._label}</span>
      </button>
      <div class="toast">${ICONS.check} Copied to clipboard</div>
    `;

    this.shadowRoot.querySelector(".trigger")
      .addEventListener("click", e => {
        e.stopPropagation();
        this._handleCopy();
      });
  }

  async _getMarkdown() {
    if (this._markdown) return this._markdown;

    // Ensure Turndown is available
    if (typeof TurndownService === "undefined") {
      await this._loadTurndown();
    }

    const target = document.querySelector(this._selector) || document.body;
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    // Remove script/style/nav noise
    td.remove(["script", "style", "nav", "footer", "iframe"]);

    this._markdown = td.turndown(target.innerHTML || target.outerHTML);
    return this._markdown;
  }

  _loadTurndown() {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TURNDOWN_CDN;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load Turndown"));
      document.head.appendChild(s);
    });
  }

  async _handleCopy() {
    try {
      const md = await this._getMarkdown();
      await navigator.clipboard.writeText(md);
      this._showToast("Copied to clipboard");
    } catch (err) {
      console.error("[copy-as-markdown-button]", err);
      this._showToast("Error: " + err.message);
    }
  }

  _showToast(msg) {
    const toast = this.shadowRoot.querySelector(".toast");
    toast.innerHTML = `${ICONS.check} ${msg}`;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }
}

customElements.define("copy-as-markdown-button", CopyAsMarkdownButton);
