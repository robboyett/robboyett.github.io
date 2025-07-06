class ArticleCard extends HTMLElement {
  static get observedAttributes() {
    return ['emoji', 'title', 'paragraph', 'link', 'linktext', 'images'];
  }

  constructor() {
    super();
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const emoji = this.getAttribute('emoji') || '';
    const title = this.getAttribute('title') || '';
    const paragraph = this.getAttribute('paragraph') || '';
    const link = this.getAttribute('link') || '#';
    const linktext = this.getAttribute('linktext') || 'Read Here';
    const date = this.getAttribute('date') || '';
    let images = [];
    try {
      images = JSON.parse(this.getAttribute('images') || '[]');
    } catch (e) {
      images = [];
    }

    this.innerHTML = `
      <link href="https://cdn.tailwindcss.com" rel="stylesheet">
      <div class="block w-full h-20 mb-1 p-5 rounded-lg overflow-hidden bg-white text-[0.7em] flex flex-wrap justify-between gap-4">
        <div class="flex flex-row gap-4">
          <div class="w-[60px] text-[2em]">${emoji}</div>
          <div class="flex flex-col justify-between gap-2 mt-3">
            <div class="flex flex-col gap-4">
              <h2 class="text-[1em]">${title}</h2>
              <p class="text-[#74716F]">${paragraph}</p>
            </div>
            <div class="flex flex-col gap-2">
              <a href="${link}" target="_blank" class="underline hover:no-underline">${linktext}</a>
              <p class="text-[#BAB8B7] text-[0.7em]">${date}</p>
            
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 justify-end">
          ${images.map(src => `<img src="${src}" alt="Image" class="w-[200px] h-[200px] object-cover rounded-lg">`).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('article-card', ArticleCard); 