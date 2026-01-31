/**
 * Site Navigation Web Component
 * A reusable navigation component with logo and journal dropdown menu.
 * 
 * Usage: <site-nav></site-nav>
 * 
 * Events:
 * - 'menu-open': Dispatched when the dropdown menu opens
 * - 'menu-close': Dispatched when the dropdown menu closes
 * - 'entries-loaded': Dispatched when journal entries are loaded, with detail containing the entries
 * 
 * Methods:
 * - getMenuItems(): Returns an array of menu item elements
 */
class SiteNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.entries = [];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadJournalEntries();
    }
    
    // Public method to get menu items for external event binding
    getMenuItems() {
        return Array.from(this.shadowRoot.querySelectorAll('.journal-menu-item'));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                *, *::before, *::after {
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    font-feature-settings:
                        'liga' 1, 'dlig' 1, 'calt' 1, 'zero' 1, 'kern' 1,
                        'ss01' 1, 'ss02' 0, 'ss03' 1,
                        'cv01' 1, 'cv03' 1, 'cv04' 1, 'cv06' 1, 'cv07' 1, 'cv09' 1, 'cv10' 0, 'cv11' 1,
                        'tnum' 1;
                }
                @supports (font-variation-settings: normal) {
                    :host {
                        font-family: 'Inter var', 'InterVariable', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    }
                }

                .nav {
                    display: flex;
                    flex-direction: row !important;
                    flex-wrap: nowrap;
                    gap: 6px;
                    align-items: flex-start;
                    margin-bottom: 80px;
                }

                .nav-item {
                    background: white;
                    padding: 34px 44px;
                    font-weight: 700;
                    font-size: 30px;
                    letter-spacing: -1.5px;
                    color: #202020;
                    text-decoration: none;
                    flex-shrink: 0;
                }

                .nav-item.logo {
                    min-width: auto;
                    padding: 27px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 104px;
                }

                /* Journal Dropdown */
                .journal-dropdown {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    position: relative;
                }

                .journal-toggle {
                    background: white;
                    padding: 27px;
                    font-weight: 700;
                    font-size: 30px;
                    letter-spacing: -1.2px;
                    color: #202020;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    height: 104px;
                    font-family: inherit;
                }

                .journal-toggle:hover {
                    background: #fafafa;
                }

                .journal-toggle .arrow {
                    font-size: 14px;
                    transition: transform 0.3s ease;
                    display: inline-block;
                }

                .journal-dropdown.open .journal-toggle .arrow {
                    transform: rotate(180deg);
                }

                /* Journal Menu Items */
                .journal-menu {
                    display: none;
                    flex-direction: column;
                    gap: 6px;
                    align-items: flex-start;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    z-index: 100;
                    margin-top: 6px;
                }

                .journal-dropdown.open .journal-menu {
                    display: flex;
                }

                .journal-menu-item {
                    background: white;
                    padding: 34px 44px;
                    font-weight: 700;
                    font-size: 30px;
                    letter-spacing: -1.2px;
                    color: #202020;
                    text-decoration: none;
                    display: block;
                    max-width: calc(100vw - 124px);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    position: relative;
                }

                .journal-menu-item:hover {
                    background: #fafafa;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .nav {
                        flex-direction: row;
                        flex-wrap: nowrap;
                        align-items: stretch;
                        margin-bottom: 48px;
                    }

                    .nav-item {
                        padding: 16px 20px;
                        font-size: 20px;
                    }

                    .nav-item.logo {
                        height: 64px;
                        width: 64px;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .nav-item.logo svg {
                        width: 32px;
                        height: 32px;
                    }

                    .journal-toggle {
                        padding: 16px 20px;
                        font-size: 20px;
                        height: 64px;
                    }

                    .journal-menu-item {
                        padding: 24px 32px;
                        font-size: 22px;
                        width: calc(100vw - 80px);
                        max-width: calc(100vw - 80px);
                        white-space: normal;
                        word-wrap: break-word;
                    }
                }
            </style>

            <nav class="nav">
                <a href="/" class="nav-item logo" aria-label="Home">
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="23" stroke="#202020" stroke-width="3" fill="none"/>
                        <circle cx="17" cy="20" r="3" fill="#202020"/>
                        <circle cx="33" cy="20" r="3" fill="#202020"/>
                        <path d="M15 32 Q25 40 35 32" stroke="#202020" stroke-width="3" stroke-linecap="round" fill="none"/>
                    </svg>
                </a>
                
                <div class="journal-dropdown" id="journalDropdown">
                    <button class="journal-toggle" id="journalToggle">
                        Journal
                        <span class="arrow">▼</span>
                    </button>
                    <div class="journal-menu" id="journalMenu">
                        <!-- Menu items loaded from journal.xml -->
                    </div>
                </div>
            </nav>
        `;
    }

    setupEventListeners() {
        const dropdown = this.shadowRoot.getElementById('journalDropdown');
        const toggle = this.shadowRoot.getElementById('journalToggle');

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMenu();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            // Check if click is outside the shadow root
            if (!this.contains(e.target) && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        const dropdown = this.shadowRoot.getElementById('journalDropdown');
        dropdown.classList.add('open');
        this.isOpen = true;
        this.dispatchEvent(new CustomEvent('menu-open', { bubbles: true }));
    }

    closeMenu() {
        const dropdown = this.shadowRoot.getElementById('journalDropdown');
        dropdown.classList.remove('open');
        this.isOpen = false;
        this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true }));
    }

    async loadJournalEntries() {
        const menu = this.shadowRoot.getElementById('journalMenu');
        
        try {
            const response = await fetch('/journal.xml');
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            const entries = xml.querySelectorAll('entry');
            
            const loadedEntries = [];
            
            entries.forEach(entry => {
                const title = entry.querySelector('title').textContent;
                const url = entry.querySelector('url').textContent;
                const preview = entry.querySelector('preview');
                const placeholder = entry.querySelector('placeholder');
                
                const link = document.createElement('a');
                link.href = url;
                link.className = 'journal-menu-item';
                link.textContent = title;
                
                // Store preview data as data attributes
                if (preview) {
                    link.dataset.preview = preview.textContent;
                }
                if (placeholder) {
                    link.dataset.previewPlaceholder = placeholder.textContent;
                }
                
                menu.appendChild(link);
                loadedEntries.push({
                    element: link,
                    title,
                    url,
                    preview: preview?.textContent,
                    placeholder: placeholder?.textContent
                });
            });
            
            this.entries = loadedEntries;
            
            // Dispatch event so external code can attach handlers
            this.dispatchEvent(new CustomEvent('entries-loaded', {
                bubbles: true,
                detail: { entries: loadedEntries }
            }));
        } catch (error) {
            console.error('Error loading journal entries:', error);
        }
    }
}

// Register the custom element
customElements.define('site-nav', SiteNav);

