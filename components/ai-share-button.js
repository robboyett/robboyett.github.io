/**
 * <ai-share-button> — Web Component
 *
 * Attributes:
 *   selector      CSS selector for the content to capture (default: "main")
 *   label         Text on the trigger button (default: "Share to AI")
 *   options       Comma-separated list of actions: copy,claude,chatgpt (default: all three)
 *   char-limit    Max characters to send via URL (default: 12000)
 *
 * CSS custom properties (set on the element or a parent):
 *   --ai-share-bg          Button background  (default: #0f0f0f)
 *   --ai-share-fg          Text / icon colour (default: #e2e2e2)
 *   --ai-share-accent      Hover / active accent (default: #ffffff)
 *   --ai-share-border      Border colour (default: #2a2a2a)
 *   --ai-share-font        Font family (default: inherit)
 *   --ai-share-radius      Border radius (default: 6px)
 *
 * Usage:
 *   <ai-share-button selector="article" options="copy,claude,chatgpt"></ai-share-button>
 *
 *   Load Turndown before this file, or let the component load it lazily:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js"></script>
 *   <script src="ai-share-button.js" type="module"></script>
 */

const TURNDOWN_CDN = "https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js";

const ICONS = {
  copy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  claude: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"/></svg>`,
  chatgpt: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.37 2.02-1.164a.076.076 0 0 1 .071 0l4.83 2.786a4.49 4.49 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.68zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  chevron: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
};

const ACTION_META = {
  copy:    { label: "Copy as Markdown",  description: "Copy page content for AI",     icon: ICONS.copy },
  claude:  { label: "Open in Claude",    description: "Ask questions about this page", icon: ICONS.claude },
  chatgpt: { label: "Open in ChatGPT",   description: "Ask questions about this page", icon: ICONS.chatgpt },
};

const STYLES = `
  :host {
    display: inline-block;
    position: relative;
    font-family: var(--ai-share-font, inherit);
    --bg:      var(--ai-share-bg, #0f0f0f);
    --fg:      var(--ai-share-fg, #e2e2e2);
    --accent:  var(--ai-share-accent, #ffffff);
    --border:  var(--ai-share-border, #2a2a2a);
    --radius:  var(--ai-share-radius, 6px);
    --subtle:  #1a1a1a;
    --muted:   #666;
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

  .trigger:hover .chevron {
    transform: rotate(180deg);
  }

  .trigger-icon {
    opacity: 0.6;
    display: flex;
    align-items: center;
  }

  .chevron {
    opacity: 0.5;
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .trigger[aria-expanded="true"] .chevron {
    transform: rotate(180deg);
  }

  /* Dropdown */
  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 230px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 4px;
    z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3);
    opacity: 0;
    transform: translateY(-4px);
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .dropdown.open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: calc(var(--radius) - 2px);
    cursor: pointer;
    transition: background 0.1s ease;
    border: none;
    background: transparent;
    width: 100%;
    color: var(--fg);
    font-family: inherit;
    text-align: left;
  }

  .menu-item:hover {
    background: var(--subtle);
  }

  .menu-item:hover .item-label {
    color: var(--accent);
  }

  .item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--subtle);
    border: 1px solid var(--border);
    border-radius: 5px;
    flex-shrink: 0;
    color: var(--fg);
    transition: border-color 0.1s ease;
  }

  .menu-item:hover .item-icon {
    border-color: var(--accent);
    color: var(--accent);
  }

  .item-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .item-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--fg);
    transition: color 0.1s ease;
  }

  .item-desc {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.01em;
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 4px 2px;
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

  .truncation-warning {
    font-size: 10px;
    color: var(--muted);
    padding: 4px 10px 6px;
    text-align: center;
    border-top: 1px solid var(--border);
    margin-top: 4px;
  }

  .truncation-warning span {
    color: #f0c060;
  }
`;

class AiShareButton extends HTMLElement {
  static get observedAttributes() {
    return ["label", "selector", "options", "char-limit"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._open = false;
    this._markdown = null;
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  get _options() {
    const raw = this.getAttribute("options") || "copy,claude,chatgpt";
    return raw.split(",").map(s => s.trim()).filter(s => ACTION_META[s]);
  }

  get _selector() {
    return this.getAttribute("selector") || "main";
  }

  get _label() {
    return this.getAttribute("label") || "Share to AI";
  }

  get _charLimit() {
    return parseInt(this.getAttribute("char-limit") || "12000", 10);
  }

  connectedCallback() {
    this._render();
    document.addEventListener("click", this._handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._handleOutsideClick);
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) this._render();
  }

  _render() {
    const options = this._options;
    const hasOpen = options.some(o => o !== "copy");

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <button class="trigger" aria-haspopup="true" aria-expanded="false">
        <span class="trigger-icon">${ICONS.copy}</span>
        <span>${this._label}</span>
        <span class="chevron">${ICONS.chevron}</span>
      </button>
      <div class="dropdown" role="menu">
        ${options.map((opt, i) => {
          const meta = ACTION_META[opt];
          const divider = (i > 0 && opt !== "copy" && options[i-1] === "copy")
            ? `<div class="divider"></div>` : "";
          return `${divider}
          <button class="menu-item" data-action="${opt}" role="menuitem">
            <span class="item-icon">${meta.icon}</span>
            <span class="item-text">
              <span class="item-label">${meta.label}</span>
              <span class="item-desc">${meta.description}</span>
            </span>
          </button>`;
        }).join("")}
        <div class="truncation-warning" style="display:none">
          <span>⚠</span> Content truncated to <span>${this._charLimit}</span> chars
        </div>
      </div>
      <div class="toast">${ICONS.check} Copied to clipboard</div>
    `;

    this.shadowRoot.querySelector(".trigger")
      .addEventListener("click", e => { e.stopPropagation(); this._toggleDropdown(); });

    this.shadowRoot.querySelectorAll(".menu-item").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        this._handleAction(btn.dataset.action);
      });
    });
  }

  _toggleDropdown() {
    this._open = !this._open;
    const dropdown = this.shadowRoot.querySelector(".dropdown");
    const trigger = this.shadowRoot.querySelector(".trigger");
    dropdown.classList.toggle("open", this._open);
    trigger.setAttribute("aria-expanded", String(this._open));
  }

  _closeDropdown() {
    this._open = false;
    this.shadowRoot.querySelector(".dropdown")?.classList.remove("open");
    this.shadowRoot.querySelector(".trigger")?.setAttribute("aria-expanded", "false");
  }

  _handleOutsideClick(e) {
    if (this._open && !this.contains(e.target)) this._closeDropdown();
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

  async _handleAction(action) {
    this._closeDropdown();

    try {
      const md = await this._getMarkdown();

      if (action === "copy") {
        await navigator.clipboard.writeText(md);
        this._showToast("Copied to clipboard");
        return;
      }

      const title = document.title || window.location.href;
      const prompt = `Here is the content of the page "${title}" in Markdown:\n\n${md}`;
      const truncated = prompt.length > this._charLimit;
      const payload = truncated ? prompt.slice(0, this._charLimit) + "\n\n[...truncated]" : prompt;

      if (truncated) {
        this.shadowRoot.querySelector(".truncation-warning").style.display = "block";
        setTimeout(() => {
          if (this.shadowRoot.querySelector(".truncation-warning")) {
            this.shadowRoot.querySelector(".truncation-warning").style.display = "none";
          }
        }, 4000);
      }

      const encoded = encodeURIComponent(payload);
      const urls = {
        claude:  `https://claude.ai/new?q=${encoded}`,
        chatgpt: `https://chatgpt.com/?q=${encoded}`,
      };

      window.open(urls[action], "_blank", "noopener,noreferrer");

    } catch (err) {
      console.error("[ai-share-button]", err);
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

customElements.define("ai-share-button", AiShareButton);
