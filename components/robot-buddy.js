/**
 * Robot buddy — homepage mascot with Discuss chat + optional LLM backend.
 */
(() => {
  const LOCAL_API = 'http://localhost:3000/api/buddy';
  const PROD_API = 'https://robo-buddy-api.vercel.app/api/buddy';
  const isLocalHost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const API_URL = window.RB_API_URL || (isLocalHost ? LOCAL_API : PROD_API);
  const LLM_MAX_PASSIVE = 8;
  const LLM_MAX_CHAT = 24;
  const LLM_TIMEOUT_MS = 15000;
  const PROACTIVE_LLM_CHANCE = 0.25;          // idle chatter mostly uses the pool
  const PROACTIVE_RATE_PAUSE_MS = 5 * 60 * 1000;  // after a 429, stop poking the LLM for proactive lines
  const LLM_KINDS = new Set(['question', 'showcase', 'approached', 'chat']);
  const PASSIVE_DISMISS_MS = 6400;
  const TOUCH_ONLY = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EXP_CLASSES = ['exp-normal', 'exp-speaking', 'exp-thinking', 'exp-angry', 'exp-broken', 'exp-offline'];
  const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const MAX_DRAFT = 280;

  const BUDDY_SVG = `<svg id="rb-buddy" viewBox="0 0 64 89" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g id="rb-head" style="transform-origin: 32px 31px;">
      <g id="rb-antenna" style="transform-origin: 33px 8px;">
        <path d="M32.3147 0.0127919C33.191 -0.0488536 34.0325 0.110448 34.8085 0.531103C35.7674 1.04343 36.4815 1.91794 36.792 2.95981C37.0849 3.97971 36.96 5.07432 36.445 6.00217C35.7815 7.20347 34.8583 7.72483 33.5924 8.08066L33.6751 11.8454C39.2704 12.2943 43.9097 13.7789 48.0588 17.7695C51.9202 21.4564 54.1325 26.5442 54.1956 31.8828C54.3872 42.1583 54.071 42.6282 44.0193 42.6231L33.5094 42.6125L22.6875 42.6292C20.5771 42.6448 18.239 42.8228 16.19 42.5633C11.1844 41.9295 11.5658 38.0581 11.5309 34.3089C11.4859 29.4793 11.9019 25.6399 14.5143 21.5263C18.6566 15.0039 24.6075 12.5216 31.9931 11.8434C32.0137 10.5825 32.0502 9.322 32.1026 8.06211C30.496 7.60386 29.4187 6.94431 28.924 5.21994C28.6189 4.1727 28.7539 3.04636 29.2976 2.10068C30.0275 0.818457 30.9822 0.363134 32.3147 0.0127919Z" fill="#262626"/>
        <rect x="30.8" y="5.5" width="2.8" height="7.5" rx="1.4" fill="#151616"/>
        <circle cx="32.2" cy="4.4" r="4.7" fill="#ED1A52"/>
        <circle cx="30.6" cy="3" r="1" fill="#F5F5F5" opacity="0.85"/>
      </g>
      <path d="M24.2339 22.1365C25.5705 21.9904 29.9889 22.0706 31.5248 22.0916C34.6692 22.4225 39.9373 21.5757 42.9268 22.3408C51.6317 24.5689 51.4789 36.9516 41.9018 38.0708L29.7115 38.0967C27.8911 38.0983 24.169 38.2104 22.5525 37.8775C21.3498 37.618 20.2234 37.0838 19.2615 36.3167C13.5381 31.7317 16.9496 22.7862 24.2339 22.1365Z" fill="#F5F5F5"/>
      <g id="rb-eyes" style="transform-origin: 32px 30px;">
        <path d="M24.205 27.2509C25.8222 26.8671 27.4478 27.8529 27.8551 29.4642C28.2625 31.0756 27.3006 32.7155 25.6953 33.1464C24.6359 33.4308 23.5054 33.1224 22.7368 32.3396C21.9684 31.5568 21.6812 30.4207 21.9854 29.3666C22.2895 28.3126 23.1376 27.504 24.205 27.2509Z" fill="#262626"/>
        <path d="M40.2508 27.2555C41.8679 26.91 43.4605 27.9354 43.8153 29.5505C44.1701 31.1656 43.1537 32.764 41.5407 33.128C39.9145 33.495 38.3003 32.4686 37.9427 30.8404C37.5851 29.2121 38.6206 27.6039 40.2508 27.2555Z" fill="#262626"/>
      </g>
      <g id="rb-eyes-happy">
        <path d="M20.8 28.6 Q24.4 32.4 28 28.6" stroke="#262626" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M37.2 28.6 Q40.8 32.4 44.4 28.6" stroke="#262626" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      </g>
      <g id="rb-eyes-angry">
        <path d="M20.4 28.4 L28.2 31.4 L27.5 33.9 L20.9 32.4 Z" fill="#262626"/>
        <path d="M44.6 28.4 L36.8 31.4 L37.5 33.9 L44.1 32.4 Z" fill="#262626"/>
      </g>
      <g id="rb-eyes-cross">
        <path d="M21.6 30 H27.4 M24.5 27.1 V32.9" stroke="#262626" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M37.8 30 H43.6 M40.7 27.1 V32.9" stroke="#262626" stroke-width="2.1" stroke-linecap="round"/>
      </g>
      <g id="rb-eyes-flat">
        <path d="M21.6 30.4 H27.4" stroke="#8a8a8a" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M37.8 30.4 H43.6" stroke="#8a8a8a" stroke-width="2.2" stroke-linecap="round"/>
      </g>
    </g>
    <g id="rb-steam">
      <g transform="translate(14, 5) scale(-0.26, 0.26)">
        <path d="M21.0005 8.86895C24.6672 5.03562 34.3005 -0.631053 39.5005 3.36895C44.7005 7.36895 42.0005 14.369 40.5005 17.869C43.8339 20.5356 48.5005 25.8689 45.5005 31.8689C42.5666 37.7368 33.8339 37.2023 30.5005 36.3689C29.3339 39.3689 26.3005 44.3689 21.5005 44.3689C16.7005 44.3689 12.6672 39.3689 11.5005 36.3689" stroke="#F92455" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M3.50053 36.8689L17.5005 32.8689" stroke="#F92455" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M2.00053 26.8689L18.0005 20.3689" stroke="#F92455" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>
      <g transform="translate(50, 5) scale(0.26)">
        <path d="M21.0005 8.86895C24.6672 5.03562 34.3005 -0.631053 39.5005 3.36895C44.7005 7.36895 42.0005 14.369 40.5005 17.869C43.8339 20.5356 48.5005 25.8689 45.5005 31.8689C42.5666 37.7368 33.8339 37.2023 30.5005 36.3689C29.3339 39.3689 26.3005 44.3689 21.5005 44.3689C16.7005 44.3689 12.6672 39.3689 11.5005 36.3689" stroke="#F92455" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M3.50053 36.8689L17.5005 32.8689" stroke="#F92455" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M2.00053 26.8689L18.0005 20.3689" stroke="#F92455" stroke-width="4" stroke-linecap="round" fill="none"/>
      </g>
    </g>
    <g id="rb-armL" style="transform-origin: 9px 63px;">
      <path d="M4.15177 59.2206C6.01542 59.0382 7.96671 59.8278 8.94816 61.4767C9.62858 62.6414 9.81546 64.0297 9.4672 65.3329C9.07547 66.8351 7.71622 68.6609 6.44718 66.7085C6.09012 66.1591 6.99478 64.5785 7.25748 64.0081C6.9639 63.2915 6.6868 62.9012 6.17728 62.3314C4.43778 61.0632 2.06644 62.6989 2.83793 64.7534C3.1254 65.5194 3.19437 66.4573 2.37552 66.9156C2.0568 67.0941 1.6326 67.1539 1.29081 66.9479C-0.383877 65.7157 -0.250087 63.3212 0.678014 61.6703C1.49894 60.2388 2.63724 59.6361 4.15177 59.2206Z" fill="#19191B"/>
      <path d="M10.5564 48.2129L10.6574 48.2289C10.9929 48.6106 10.7857 52.0898 10.8457 53.0375C10.5352 53.2401 10.2326 53.4548 9.93875 53.681C8.25198 54.9778 7.7681 56.276 7.50626 58.2917C6.61758 58.0366 6.02213 57.8929 5.11307 57.7284C4.64432 57.7457 4.27896 57.7783 3.81583 57.691C3.38858 56.5574 4.57327 53.5679 5.13028 52.5035C6.35782 50.158 8.06644 48.9689 10.5564 48.2129Z" fill="#177FF9"/>
    </g>
    <g id="rb-armR" style="transform-origin: 55px 63px;">
      <path d="M58.3181 59.2245C58.9066 59.1694 59.5555 59.196 60.1315 59.3272C61.3767 59.6041 62.4604 60.3656 63.1427 61.4433C64.0341 62.8688 64.282 65.8214 62.6631 67.0111C62.4467 67.1701 62.0395 67.1802 61.7665 67.0932C59.9225 66.5057 61.8221 64.1168 60.8731 62.8576C60.3671 62.1207 59.9274 62.0342 59.1176 61.8174C57.6111 61.9975 57.2124 62.7248 56.6918 64.0356C56.9118 64.7721 57.8523 66.3071 57.3659 66.8766C55.9903 68.4867 54.8573 66.8094 54.5118 65.6745C54.0909 64.331 54.2328 62.8742 54.9053 61.6373C55.705 60.1904 56.8211 59.6483 58.3181 59.2245Z" fill="#19191B"/>
      <path d="M53.218 48.1786C57.0457 49.0927 59.1464 52.0337 60.0133 55.7567C60.1325 56.2684 60.3774 57.2513 60.0984 57.6962L59.7239 57.7286C58.1951 57.7455 57.9497 57.7687 56.4865 58.328C56.2111 56.0905 55.2074 54.1627 53.0948 53.1544C53.1236 51.4955 53.1647 49.8368 53.218 48.1786Z" fill="#12A95F"/>
    </g>
    <g id="rb-body" style="transform-origin: 32px 58px;">
      <path d="M17.1667 44.3511C18.6929 44.2674 20.807 44.3309 22.3791 44.3312L32.2724 44.3313L41.4678 44.3307C47.5398 44.3327 52.0727 43.5243 51.6297 51.3526C51.5341 53.0421 51.6295 55.2156 51.6316 56.9654L51.6378 63.9894C51.6375 68.2807 52.105 71.7739 46.8366 72.9812C44.4599 73.1047 41.9135 73.0428 39.5211 73.0448C35.791 73.0674 32.0608 73.071 28.3307 73.0559C26.2394 73.046 24.1482 73.0476 22.0569 73.0608C20.0182 73.0749 16.6905 73.3142 14.8887 72.249C12.0335 70.561 12.3338 67.2897 12.3593 64.4494C12.3761 62.5711 12.3621 60.634 12.3605 58.729L12.3592 52.62C12.3618 48.6946 11.994 44.8218 17.1667 44.3511Z" fill="#19191b"/>
      <g id="rb-chest" style="transform-origin: 32px 54px;">
        <path d="M33.9366 56.6212L43.5794 56.6184L43.56 58.4639C40.6759 58.5868 36.8924 58.4755 33.9306 58.468L33.9366 56.6212Z" fill="#F5F5F5"/>
        <path d="M33.9514 51.7939L43.5733 51.8337L43.5014 53.5864C40.3157 53.6168 37.1298 53.6123 33.9441 53.5727L33.9514 51.7939Z" fill="#F5F5F5"/>
      </g>
    </g>
    <g id="rb-dangle" style="transform-origin: 32px 82px;">
      <path d="M25.5 74 H38.5 C38.5 77.6 35.6 80.5 32 80.5 C28.4 80.5 25.5 77.6 25.5 74 Z" fill="#FDBC1B"/>
      <path d="M32 82.4 V88" stroke="#F21A5A" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M28.4 82.2 L26.2 87.4" stroke="#F21A5A" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M35.6 82.2 L37.8 87.4" stroke="#F21A5A" stroke-width="1.6" stroke-linecap="round"/>
    </g>
  </svg>`;

  // Broken state — a fixed, disassembled arrangement (matches Figma node 38:255),
  // swapped in for the live robot and shown still.
  const BROKEN_SVG = `<svg id="rb-broken" viewBox="0 0 112 84" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g transform="rotate(-12 84 53)">
      <rect x="62" y="35" width="46" height="37" rx="15" fill="#19191b"/>
      <rect x="82" y="45" width="17" height="4" rx="2" fill="#ffffff"/>
      <rect x="82" y="52" width="17" height="4" rx="2" fill="#ffffff"/>
    </g>
    <g transform="rotate(-52 51 59)">
      <path d="M51 51 a3 3 0 1 1 0 5.6 a3 3 0 1 1 0 5.6 a3 3 0 1 1 0 5.6" stroke="#9b9b9b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </g>
    <g transform="translate(67 21) scale(0.3) rotate(148 17 25)">
      <path d="M0 0C16.3372 0 28 12.4626 28 25.5H15C15 20.1374 9.66278 13 0 13V0Z" fill="#12A95F"/>
      <path d="M27.5 40.1055C27.4999 38.5243 25.5801 36 21.5 36C17.4199 36 15.5001 38.5243 15.5 40.1055C15.5 41.1629 16.1937 42.4771 17.9609 43.3906C19.6781 44.2782 20.3514 46.3902 19.4639 48.1074C18.5763 49.8245 16.4642 50.4969 14.7471 49.6094C11.2748 47.8147 8.5 44.4126 8.5 40.1055C8.50012 33.2858 15.0869 29 21.5 29C27.9131 29 34.4999 33.2858 34.5 40.1055C34.5 44.0816 32.1218 47.3042 29.0322 49.1729C27.3783 50.1732 25.2269 49.6432 24.2266 47.9893C23.2262 46.3352 23.7561 44.184 25.4102 43.1836C26.9114 42.2755 27.5 41.0908 27.5 40.1055Z" fill="#19191b"/>
    </g>
    <g transform="rotate(-38 37 38)">
      <rect x="15" y="20" width="47" height="36" rx="18" fill="#19191b"/>
      <rect x="21" y="27" width="35" height="22" rx="11" fill="#ffffff"/>
    </g>
    <path d="M40.5 33.7 h6 M43.5 30.7 v6" stroke="#19191b" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M29.5 42.3 h6 M32.5 39.3 v6" stroke="#19191b" stroke-width="2.6" stroke-linecap="round"/>
    <g transform="rotate(-32 20 30)"><rect x="17" y="28.4" width="7.6" height="3.4" rx="1.7" fill="#151616"/></g>
    <circle cx="12.5" cy="33" r="4.9" fill="#ED1A52"/>
    <g transform="translate(25 55) scale(0.3) rotate(-117 17.5 25)">
      <path d="M35 0C18.6628 0 7 12.4626 7 25.5H20C20 20.1374 25.3372 13 35 13V0Z" fill="#177FF9"/>
      <path d="M19 40.1055C18.9999 38.5243 17.0801 36 13 36C8.91991 36 7.00015 38.5243 7 40.1055C7 41.1629 7.6937 42.4771 9.46094 43.3906C11.1781 44.2782 11.8514 46.3902 10.9639 48.1074C10.0763 49.8245 7.96422 50.4969 6.24707 49.6094C2.77484 47.8147 0 44.4126 0 40.1055C0.000117599 33.2858 6.58689 29 13 29C19.4131 29 25.9999 33.2858 26 40.1055C26 44.0816 23.6218 47.3042 20.5322 49.1729C18.8783 50.1732 16.7269 49.6432 15.7266 47.9893C14.7262 46.3352 15.2561 44.184 16.9102 43.1836C18.4114 42.2755 19 41.0908 19 40.1055Z" fill="#19191b"/>
    </g>
    <path d="M46 71.5 A6.5 6.5 0 0 1 59 71.5 Z" fill="#FDBC1B"/>
  </svg>`;

  function buildKeyboardHTML() {
    const rows = KEY_ROWS.map((row) => {
      const keys = [...row].map((ch) =>
        `<button type="button" class="kb-key" data-key="${ch}">${ch}</button>`
      ).join('');
      return `<div class="kb-row">${keys}</div>`;
    }).join('');
    return `${rows}
      <div class="kb-row">
        <button type="button" class="kb-key wide" data-key="backspace">⌫</button>
        <button type="button" class="kb-key space" data-key=" ">space</button>
        <button type="button" class="kb-key submit">Send</button>
      </div>`;
  }

  function injectDOM() {
    const wrap = document.createElement('div');
    wrap.id = 'rb-root';
    wrap.innerHTML = `
      <div id="rb-shadow"></div>
      <div id="rb-bubble" role="dialog" aria-live="polite">
        <p class="msg"></p>
        <div class="links"></div>
        <button type="button" class="discuss">Discuss</button>
      </div>
      ${BUDDY_SVG}
      ${BROKEN_SVG}
    `;
    document.body.appendChild(wrap);

    const compose = document.createElement('div');
    compose.id = 'rb-compose';
    compose.innerHTML = `
      <button type="button" class="done" aria-label="Close">×</button>
      <div class="rb-compose-display" aria-live="polite"></div>
      <div id="rb-keyboard">${buildKeyboardHTML()}</div>
    `;
    document.body.appendChild(compose);
  }

  injectDOM();

  const buddy       = document.getElementById('rb-buddy');
  const shadow      = document.getElementById('rb-shadow');
  const head        = document.getElementById('rb-head');
  const eyes        = document.getElementById('rb-eyes');
  const antenna     = document.getElementById('rb-antenna');
  const armL        = document.getElementById('rb-armL');
  const armR        = document.getElementById('rb-armR');
  const body        = document.getElementById('rb-body');
  const chest       = document.getElementById('rb-chest');
  const dangle      = document.getElementById('rb-dangle');
  const brokenEl    = document.getElementById('rb-broken');
  const brokenHalf  = { x: 45, y: 34 };
  const bubble      = document.getElementById('rb-bubble');
  const bubbleMsg   = bubble.querySelector('.msg');
  const bubbleLinks = bubble.querySelector('.links');
  const discussBtn  = bubble.querySelector('.discuss');
  const compose     = document.getElementById('rb-compose');
  const draftDisplay = compose.querySelector('.rb-compose-display');
  const keyboard    = document.getElementById('rb-keyboard');
  const submitBtn   = compose.querySelector('.submit');
  const doneBtn     = compose.querySelector('.done');

  const context = (() => {
    const now = new Date();
    const hour = now.getHours();
    const partOfDay =
      hour < 5  ? 'night'   :
      hour < 12 ? 'morning' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening' : 'night';
    let visits = 1;
    try {
      visits = (+sessionStorage.getItem('rb_visits') || 0) + 1;
      sessionStorage.setItem('rb_visits', String(visits));
    } catch (e) { /* storage blocked */ }
    return {
      partOfDay,
      hour,
      isReturning: visits > 1,
      language: (navigator.language || 'en').split('-')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      referrer: document.referrer ? new URL(document.referrer).hostname : null,
      location: null,
      persona: (window.RB_PERSONA || null),   // background info about Rob (see robot-buddy-persona.js)
    };
  })();

  let catalog = { experiments: [], journal: [] };
  let chatDraft = '';
  let chatMode = false;
  let failReturn = null;
  let typeTimer = null;
  let proactiveLlmPausedUntil = 0;   // set when a 429 is seen; proactive chatter goes pool-only until then

  // Session memory — survives page-to-page navigation within a visit so he stays
  // coherent (the shared, cross-user memory is maintained server-side). Capped.
  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem('rb_history') || '[]'); } catch (e) { return []; }
  }
  function persistHistory() {
    conversationHistory = conversationHistory.slice(-20);
    try { sessionStorage.setItem('rb_history', JSON.stringify(conversationHistory)); } catch (e) { /* */ }
  }
  let conversationHistory = loadHistory();

  async function parseXmlEntries(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    return [...xml.querySelectorAll('entry')].map((entry) => ({
      title: entry.querySelector('title')?.textContent?.trim() || '',
      url: entry.querySelector('url')?.textContent?.trim() || '',
      description: entry.querySelector('description')?.textContent?.trim() || '',
    })).filter((e) => e.title && e.url);
  }

  async function loadCatalog() {
    // Experiments are hidden pre-launch — don't load experiments.xml, so the buddy
    // (and the LLM, which only sees this catalog) can't know about or suggest them.
    try {
      const journal = await parseXmlEntries('/journal.xml');
      catalog = {
        experiments: [],
        journal: journal.filter((e) => e.url.startsWith('/journal/')),
      };
    } catch (e) {
      catalog = { experiments: [], journal: [] };
    }
  }

  loadCatalog();

  const DEST = {
    article: '/journal/determinism-ai-ux/',
    caseStudy: "/journal/the-designer's-eval-loop/",
    about: '/#intro',
  };

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shortTitle(title, max = 40) {
    if (title.length <= max) return title;
    return title.slice(0, max - 1).trim() + '…';
  }

  const W = 48, H = 67;
  const half = { x: W / 2, y: H / 2 };

  const scrollX = () => window.scrollX || window.pageXOffset || 0;
  const scrollY = () => window.scrollY || window.pageYOffset || 0;
  const pageWidth = () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const pageHeight = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

  // Start just off-canvas on the left and potter in on load.
  let entering = true;
  let pos = { x: scrollX() - 90, y: scrollY() + window.innerHeight * 0.55 };
  let vel = { x: 0, y: 0 };
  let target = { x: pos.x, y: pos.y };
  let facing = 1;
  let mode = 'potter';
  let mouse = { x: pos.x, y: pos.y };
  let pointerClient = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let mouseStillSince = performance.now();
  let lastPointer = { x: mouse.x, y: mouse.y };
  let pickWanderAt = 0;
  let approachRepickAt = 0;
  let gaze = { x: pos.x + 100, y: pos.y };
  let idleGaze = { x: pos.x + 100, y: pos.y };
  let gazePickAt = 0;
  let fleeUntil = 0;
  let startle = 0;
  let t = 0;
  let bubbleOpen = false;
  let idleChatAt = performance.now() + 6000 + Math.random() * 6000;
  let autoDismiss = null;
  let sayInFlight = false;
  let expression = 'normal';
  let expressionSince = performance.now();

  buddy.classList.add('exp-normal');
  function setExpression(name) {
    if (expression === name) return;
    expression = name;
    expressionSince = performance.now();
    EXP_CLASSES.forEach((c) => buddy.classList.toggle(c, c === `exp-${name}`));
  }
  if (isLocalHost) window.__rbExp = setExpression;  // dev-only state preview

  function syncMousePage() {
    mouse.x = pointerClient.x + scrollX();
    mouse.y = pointerClient.y + scrollY();
  }

  function pointerMoved(clientX, clientY) {
    pointerClient.x = clientX;
    pointerClient.y = clientY;
    syncMousePage();
    const moved = Math.hypot(mouse.x - lastPointer.x, mouse.y - lastPointer.y);
    if (moved > 6) {
      mouseStillSince = performance.now();
      lastPointer = { x: mouse.x, y: mouse.y };
      if (mode === 'approach') mode = 'potter';
    }
  }

  window.addEventListener('mousemove', (e) => pointerMoved(e.clientX, e.clientY));
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length) pointerMoved(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length) pointerMoved(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('scroll', syncMousePage, { passive: true });

  buddy.addEventListener('click', (e) => {
    e.stopPropagation();
    const away = Math.atan2(pos.y - mouse.y, pos.x - mouse.x);
    vel.x += Math.cos(away) * 9;
    vel.y += Math.sin(away) * 9;
    mode = 'flee';
    fleeUntil = performance.now() + 1400;
    startle = 1;
  });

  function newWanderTarget() {
    const m = 70;
    const sx = scrollX();
    const sy = scrollY();
    target.x = sx + m + Math.random() * (window.innerWidth - 2 * m);
    target.y = sy + m + Math.random() * (window.innerHeight - 2 * m);
    pickWanderAt = performance.now() + 4200 + Math.random() * 4000;
  }
  newWanderTarget();
  // Override the first stop: amble in to a spot in the left of the view, then wander.
  target.x = scrollX() + Math.min(260, window.innerWidth * 0.22);
  target.y = pos.y;

  let blinkUntil = 0;
  function maybeBlink(now) {
    if (now > blinkUntil && Math.random() < 0.004) blinkUntil = now + 130;
  }

  function approachStillThreshold() {
    return TOUCH_ONLY ? 4000 : 1800;
  }

  function frame(now) {
    t += 1;

    // Broken — frozen still arrangement: no movement, no shadow.
    if (expression === 'broken') {
      buddy.style.display = 'none';
      if (brokenEl.style.display !== 'block') brokenEl.style.display = 'block';
      brokenEl.style.transform = `translate(${pos.x - brokenHalf.x}px, ${pos.y - brokenHalf.y}px)`;
      shadow.style.opacity = '0';
      if (bubbleOpen) positionBubble();
      requestAnimationFrame(frame);
      return;
    }
    if (brokenEl.style.display === 'block') { brokenEl.style.display = 'none'; buddy.style.display = ''; }

    const stillFor = now - mouseStillSince;
    if (!bubbleOpen && mode !== 'flee' && !entering) {
      if (stillFor > approachStillThreshold()) mode = 'approach';
      else if (mode !== 'approach') mode = 'potter';
    }
    if (mode === 'flee' && now > fleeUntil) mode = 'potter';

    if (!bubbleOpen) {
      if (mode === 'approach') {
        // Drift toward the cursor unhurriedly, with the occasional detour so he
        // still feels like he's wandering rather than locking on.
        if (now > approachRepickAt) {
          const wander = Math.random() < 0.45;
          const scatterX = wander ? (Math.random() * 2 - 1) * 190 : 0;
          const scatterY = wander ? (Math.random() * 2 - 1) * 130 : 0;
          target.x = mouse.x - 50 + scatterX;
          target.y = mouse.y + 24 + scatterY;
          approachRepickAt = now + (wander ? 1600 : 2600) + Math.random() * 2200;
        }
      } else if (mode === 'potter' && now > pickWanderAt) {
        newWanderTarget();
      }
      if (mode !== 'flee') {
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.hypot(dx, dy);
        // Lower pull + approach gentler than potter, so he ambles over.
        const speed = mode === 'approach' ? 0.005 : 0.006;
        const settle = mode === 'approach' ? 30 : 4;
        if (dist > settle) {
          vel.x += dx * speed * 0.035;
          vel.y += dy * speed * 0.035;
        }
      }
    }

    vel.x *= 0.92;
    vel.y *= 0.92;
    pos.x += vel.x;
    pos.y += vel.y;

    const pad = 45;
    const maxX = pageWidth() - pad;
    const maxY = pageHeight() - pad;
    if (entering) { if (pos.x >= pad) entering = false; }   // let him drift on from off-canvas
    else if (pos.x < pad) { pos.x = pad; vel.x = Math.abs(vel.x) * 0.5; }
    if (pos.x > maxX) { pos.x = maxX; vel.x = -Math.abs(vel.x) * 0.5; }
    if (pos.y < pad) { pos.y = pad; vel.y = Math.abs(vel.y) * 0.5; }
    if (pos.y > maxY) { pos.y = maxY; vel.y = -Math.abs(vel.y) * 0.5; }

    const speed = Math.hypot(vel.x, vel.y);
    if (Math.abs(vel.x) > 0.3) facing = vel.x > 0 ? 1 : -1;

    const moving = speed > 0.35;
    let float = Math.sin(t * 0.06) * 3 + (moving ? Math.sin(t * 0.3) * 1.5 : 0);
    startle *= 0.88;
    const sx = 1 + startle * 0.18;
    const sy = 1 - startle * 0.18;
    const lean = Math.max(-14, Math.min(14, vel.x * 1.8));

    // ---- Expression layer: modulate the physics-driven pose per emotion ----
    let headExtraRot = 0, eyeLookYBias = 0, buddyExtra = '';
    let armOverride = null, armLRaised = false;
    if (expression === 'thinking') {
      float *= 0.4;
      headExtraRot = Math.sin(t * 0.09) * 3.2;
      eyeLookYBias = -2.2;
    } else if (expression === 'speaking') {
      armLRaised = true;                       // left arm raised while he speaks
      headExtraRot = Math.sin(t * 0.4) * 0.8;
    } else if (expression === 'angry') {
      armOverride = [-30, 30];
      if (!REDUCE_MOTION) {
        buddyExtra = ` translate(${(Math.random() - 0.5) * 1.6}px, ${(Math.random() - 0.5) * 1.2}px)`;
      }
    } else if (expression === 'offline') {
      float *= 0.15;
      headExtraRot = 7;
      armOverride = [24, -24];
    }

    buddy.style.transform =
      `translate(${pos.x - half.x}px, ${pos.y - half.y - float}px) scaleX(${facing})${buddyExtra}`;
    shadow.style.transform =
      `translate(${pos.x - 18}px, ${pos.y + half.y - 6}px) scale(${1 - float * 0.04}, 1)`;
    shadow.style.opacity = String(0.85 - Math.abs(float) * 0.05);
    body.style.transform = `rotate(${lean * 0.25}deg) scale(${sx}, ${sy})`;
    chest.style.transform = `scaleX(${facing})`;   // keep chest lines on the right when he flips

    // Gaze: he favours the cursor when it's moving or when he's heading that
    // way, but otherwise lets his eyes wander to whatever he's drifting toward.
    const cursorActive = (now - mouseStillSince) < 1600;
    const toMouseX = mouse.x - pos.x;
    const toMouseY = mouse.y - pos.y;
    const headingToCursor =
      mode === 'approach' ||
      (moving && (vel.x * toMouseX + vel.y * toMouseY) > 0 && Math.hypot(toMouseX, toMouseY) < 380);
    if (cursorActive || headingToCursor) {
      gaze.x += (mouse.x - gaze.x) * 0.12;
      gaze.y += (mouse.y - gaze.y) * 0.12;
    } else {
      if (now > gazePickAt) {
        if (moving && Math.random() < 0.6) {
          const ang = Math.atan2(vel.y, vel.x);
          idleGaze.x = pos.x + Math.cos(ang) * 130;
          idleGaze.y = pos.y + Math.sin(ang) * 130;
        } else {
          idleGaze.x = pos.x + (Math.random() * 2 - 1) * 150;
          idleGaze.y = pos.y + (Math.random() * 2 - 1) * 95;
        }
        gazePickAt = now + 700 + Math.random() * 1700;
      }
      gaze.x += (idleGaze.x - gaze.x) * 0.06;
      gaze.y += (idleGaze.y - gaze.y) * 0.06;
    }

    const lookX = Math.max(-2.4, Math.min(2.4, (gaze.x - pos.x) * 0.02 * facing));
    const lookY = Math.max(-1.6, Math.min(1.6, (gaze.y - pos.y) * 0.012));
    const headDrop = expression === 'broken' ? 2 : 0;
    head.style.transform =
      `rotate(${-lean * 0.16 + headExtraRot}deg) translate(${lookX * facing}px, ${lookY + headDrop}px)`;

    maybeBlink(now);
    const blinking = now < blinkUntil;
    eyes.style.transform =
      `translate(${lookX * 1.5}px, ${lookY * 1.5 + eyeLookYBias}px) scaleY(${blinking ? 0.12 : 1})`;

    antenna.style.transform = `rotate(${Math.sin(t * 0.07) * 2 + (-vel.x * 1.4)}deg)`;
    const armSway = Math.sin(t * 0.05) * 2.2 + (moving ? Math.sin(t * 0.3) * 5 : 0);
    if (armLRaised) {
      // Left arm raised — vertical flip pivoted at the shoulder.
      armL.style.transformOrigin = '5.43px 52px';
      armL.style.transform = 'scaleY(-1)';
      armR.style.transform = `rotate(${-armSway}deg)`;
    } else if (armOverride) {
      armL.style.transformOrigin = '9px 63px';
      armL.style.transform = `rotate(${armOverride[0]}deg)`;
      armR.style.transform = `rotate(${armOverride[1]}deg)`;
    } else if (mode === 'flee') {
      armL.style.transformOrigin = '9px 63px';
      armL.style.transform = 'rotate(-38deg)';
      armR.style.transform = 'rotate(38deg)';
    } else {
      armL.style.transformOrigin = '9px 63px';
      armL.style.transform = `rotate(${armSway}deg)`;
      armR.style.transform = `rotate(${-armSway}deg)`;
    }
    dangle.style.transform = `rotate(${Math.sin(t * 0.06) * 2.5 - vel.x * 1.2}deg)`;

    if (bubbleOpen) positionBubble();
    requestAnimationFrame(frame);
  }
  // Place him off-canvas before the first paint so he doesn't flash at (0,0).
  buddy.style.transform = `translate(${pos.x - half.x}px, ${pos.y - half.y}px) scaleX(1)`;
  shadow.style.opacity = '0';
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    pos.x = Math.min(pos.x, pageWidth() - 45);
    pos.y = Math.min(pos.y, pageHeight() - 45);
  });

  function positionBubble() {
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const sx = scrollX();
    const sy = scrollY();
    let bx = pos.x - 18;
    let by = pos.y - half.y - bh - 10;
    bx = Math.max(sx + 8, Math.min(sx + window.innerWidth - bw - 8, bx));
    by = Math.max(sy + 8, by);
    bubble.style.transform = `translate(${bx}px, ${by}px)`;
  }

  function getLlmCallCount(key) {
    try { return +sessionStorage.getItem(key) || 0; } catch (e) { return 0; }
  }

  function incrementLlmCallCount(key) {
    try { sessionStorage.setItem(key, String(getLlmCallCount(key) + 1)); } catch (e) { /* */ }
  }

  function canCallLlm(kind) {
    const key = kind === 'chat' ? 'rb_llm_chat' : 'rb_llm_passive';
    const max = kind === 'chat' ? LLM_MAX_CHAT : LLM_MAX_PASSIVE;
    return getLlmCallCount(key) < max;
  }

  async function fetchLlmMessage(kind, extra = {}) {
    if (!canCallLlm(kind)) return { fail: 'cap' };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, context, catalog, history: conversationHistory, ...extra }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        if (isLocalHost) console.warn('[robot-buddy] API', res.status, API_URL);
        if (res.status === 429) return { fail: 'rate' };
        return { fail: 'api' };
      }
      const data = await res.json();
      if (!data || typeof data.text !== 'string') return { fail: 'bad' };
      const key = kind === 'chat' ? 'rb_llm_chat' : 'rb_llm_passive';
      incrementLlmCallCount(key);
      return { text: data.text, links: data.links || [], mood: data.mood || null };
    } catch (e) {
      clearTimeout(timeout);
      if (isLocalHost) console.warn('[robot-buddy] fetch failed:', e.message, API_URL);
      return { fail: e.name === 'AbortError' ? 'timeout' : 'offline' };
    }
  }

  // Small pregenerated pool for proactive chatter — mixed with LLM lines.
  // Chat replies are LLM-only; failures show the Offline/Broken face, not words.
  const POOL = {
    welcome: [
      { text: 'Oh — hello. I was just pottering about.', links: [] },
      { text: `Good ${context.partOfDay}. Make yourself at home.`, links: [] },
    ],
    question: [
      { text: 'Random thought: do you think better moving, or sitting still?', links: [] },
      { text: "If you could keep just one tab open forever, what'd be on it?", links: [] },
    ],
    showcase: [
      { text: 'There is a piece I keep coming back to.', links: [{ label: 'Read it', goto: DEST.article, sendoff: "It's this way." }] },
      { text: 'Do you like a messy problem, or do they make you want to lie down?', links: [{ label: 'Show me one', goto: DEST.caseStudy, sendoff: "Then you'll want this." }] },
    ],
  };

  function pooledMessage(kind) {
    const pool = POOL[kind];
    return pool ? pickRandom(pool) : null;
  }

  // A 429 means the upstream key is rate-limited — stop firing proactive LLM
  // calls for a while so we don't keep poking it (chat is left alone).
  function noteRateLimit(fail) {
    if (fail === 'rate') proactiveLlmPausedUntil = performance.now() + PROACTIVE_RATE_PAUSE_MS;
  }

  async function getNextMessage(kind, extra = {}) {
    if (kind === 'chat') {
      // LLM only — no scripted reply. On failure, return the reason so the caller
      // shows the Offline/Broken face instead of words.
      if (!canCallLlm('chat')) return { fail: 'cap' };
      const llm = await fetchLlmMessage('chat', extra);
      if (!llm.text) noteRateLimit(llm.fail);
      return llm.text ? llm : { fail: llm.fail };
    }
    // Proactive: mostly the pregenerated pool, occasionally the LLM — and never the
    // LLM while we're backing off from a recent rate-limit.
    const mayUseLlm = LLM_KINDS.has(kind) && canCallLlm(kind) && performance.now() >= proactiveLlmPausedUntil;
    if (mayUseLlm && Math.random() < PROACTIVE_LLM_CHANCE) {
      const llm = await fetchLlmMessage(kind, extra);
      if (llm.text) return llm;
      noteRateLimit(llm.fail);
    }
    return pooledMessage(kind);
  }

  // Map a message's mood / failure reason to the robot's expression.
  function expressionFor(message) {
    if (message.fail === 'offline' || message.fail === 'cap') return 'offline';
    if (message.fail === 'api' || message.fail === 'bad' ||
        message.fail === 'timeout' || message.fail === 'rate') return 'broken';
    if (message.mood === 'angry') return 'angry';
    return 'speaking';
  }

  function renderLinks(links) {
    bubbleLinks.innerHTML = '';
    (links || []).forEach((link) => {
      if (!link?.goto) return;
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'link-go';
      a.textContent = `${link.label} →`;
      a.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateTo(link.goto, link.sendoff);
      });
      bubbleLinks.appendChild(a);
    });
  }

  function updateDiscussVisibility(loading) {
    discussBtn.hidden = loading || chatMode;
  }

  function schedulePassiveDismiss() {
    clearTimeout(autoDismiss);
    if (chatMode) return;
    autoDismiss = setTimeout(() => closeChatAndBubble(), PASSIVE_DISMISS_MS);
  }

  function renderMessage(message) {
    clearTimeout(typeTimer);
    bubble.classList.remove('loading');
    const full = message.text || '';

    setExpression(expressionFor(message));

    // Open the bubble empty; links/Discuss appear once the text finishes typing.
    bubbleLinks.innerHTML = '';
    const hasFooter = (message.links?.length > 0) || !chatMode;
    bubble.classList.toggle('has-footer', hasFooter);
    updateDiscussVisibility(true);
    bubbleMsg.textContent = '';
    positionBubble();
    requestAnimationFrame(() => bubble.classList.add('show'));
    bubbleOpen = true;
    vel.x = 0;
    vel.y = 0;

    conversationHistory.push({ role: 'buddy', text: full });
    persistHistory();

    const finish = () => {
      bubbleMsg.textContent = full;
      renderLinks(message.links);
      updateDiscussVisibility(false);
      positionBubble();
      schedulePassiveDismiss();
    };

    // Type it out (bottom of the bubble stays anchored to the tail as it grows).
    if (REDUCE_MOTION || full.length <= 1) { finish(); return; }
    let i = 0;
    const step = () => {
      i += 1;
      bubbleMsg.textContent = full.slice(0, i);
      positionBubble();
      typeTimer = (i < full.length) ? setTimeout(step, 22 + Math.random() * 34) : (finish(), null);
    };
    typeTimer = setTimeout(step, 60);
  }

  function showLoadingBubble() {
    setExpression('thinking');
    bubbleMsg.textContent = '…';
    bubbleLinks.innerHTML = '';
    bubble.classList.add('loading');
    bubble.classList.remove('has-footer');
    updateDiscussVisibility(true);
    positionBubble();
    requestAnimationFrame(() => bubble.classList.add('show'));
    bubbleOpen = true;
    vel.x = 0;
    vel.y = 0;
    clearTimeout(autoDismiss);
  }

  function updateDraftDisplay() {
    draftDisplay.textContent = chatDraft;
    submitBtn.disabled = !chatDraft.trim() || sayInFlight;
  }

  function appendToDraft(str) {
    if (chatDraft.length >= MAX_DRAFT) return;
    chatDraft = (chatDraft + str).slice(0, MAX_DRAFT);
    updateDraftDisplay();
  }

  function backspaceDraft() {
    chatDraft = chatDraft.slice(0, -1);
    updateDraftDisplay();
  }

  function openChat() {
    if (!bubbleOpen) return;
    chatMode = true;
    chatDraft = '';
    updateDraftDisplay();
    clearTimeout(autoDismiss);
    updateDiscussVisibility(false);
    compose.classList.add('open');
    setComposeEnabled(true);
  }

  function setComposeEnabled(on) {
    submitBtn.disabled = !on || !chatDraft.trim() || sayInFlight;
    doneBtn.disabled = !on || sayInFlight;
    keyboard.querySelectorAll('.kb-key:not(.submit)').forEach((k) => { k.disabled = !on; });
  }

  function closeChat() {
    chatMode = false;
    chatDraft = '';
    updateDraftDisplay();
    compose.classList.remove('open');
    setComposeEnabled(true);
    updateDiscussVisibility(false);
  }

  function closeChatAndBubble() {
    closeChat();
    dismissBubble();
  }

  function dismissBubble(resetIdle = true) {
    clearTimeout(autoDismiss);
    clearTimeout(typeTimer);
    bubble.classList.remove('show', 'loading');
    bubbleOpen = false;
    setExpression('normal');
    if (chatMode) closeChat();
    if (resetIdle) {
      idleChatAt = performance.now() + 12000 + Math.random() * 10000;
    }
  }

  function navigateTo(url, sendoff) {
    closeChat();
    bubbleMsg.textContent = sendoff || 'This way —';
    bubbleLinks.innerHTML = '';
    bubble.classList.remove('has-footer', 'loading');
    discussBtn.hidden = true;
    positionBubble();
    body.style.transform += ' translateY(-2px)';
    clearTimeout(autoDismiss);
    setTimeout(() => { window.location.href = url; }, 750);
  }

  async function submitChat() {
    const text = chatDraft.trim();
    if (!text || sayInFlight) return;

    conversationHistory.push({ role: 'visitor', text });
    persistHistory();
    chatDraft = '';
    updateDraftDisplay();

    sayInFlight = true;
    setComposeEnabled(false);
    showLoadingBubble();

    try {
      const message = await getNextMessage('chat', { message: text });
      if (message.text && bubbleOpen) renderMessage(message);
      else showChatFailure(message.fail);
    } finally {
      sayInFlight = false;
      setComposeEnabled(true);
      updateDraftDisplay();
    }
  }

  // Chat failure — no words, the face carries it. Compose stays open to retry.
  function showChatFailure(fail) {
    bubble.classList.remove('show', 'loading');
    bubbleOpen = false;
    const expr = (fail === 'offline' || fail === 'cap') ? 'offline' : 'broken';
    setExpression(expr);
    clearTimeout(failReturn);
    failReturn = setTimeout(() => {
      if (expression === expr && !bubbleOpen) setExpression('normal');
    }, 3600);
  }

  async function say(kind, extra = {}) {
    if (bubbleOpen || sayInFlight) return;
    sayInFlight = true;
    const willLoad = LLM_KINDS.has(kind) && canCallLlm(kind);
    if (willLoad) showLoadingBubble();
    try {
      const message = await getNextMessage(kind, extra);
      if (message && message.text && (bubbleOpen || !willLoad)) renderMessage(message);
      else dismissBubble();
    } finally {
      sayInFlight = false;
    }
  }

  discussBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearTimeout(autoDismiss);
    openChat();
  });

  submitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    submitChat();
  });

  doneBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeChatAndBubble();
  });

  keyboard.addEventListener('click', (e) => {
    const key = e.target.closest('.kb-key');
    if (!key || key.disabled) return;
    e.stopPropagation();
    if (key.classList.contains('submit')) return;
    const val = key.dataset.key;
    if (val === 'backspace') backspaceDraft();
    else appendToDraft(val);
  });

  document.addEventListener('keydown', (e) => {
    if (!chatMode) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      submitChat();
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      backspaceDraft();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeChatAndBubble();
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      appendToDraft(e.key);
    }
  });

  window.addEventListener('mousedown', (e) => {
    if (!bubbleOpen && !chatMode) return;
    if (bubble.contains(e.target) || buddy.contains(e.target) || compose.contains(e.target)) return;
    closeChatAndBubble();
  });

  // Greet only once he's pottered onto the canvas.
  setTimeout(function welcomeWhenReady() {
    if (entering) { setTimeout(welcomeWhenReady, 400); return; }
    say('welcome');
  }, 2200);

  function idleChatTick() {
    const now = performance.now();
    if (!bubbleOpen && !sayInFlight && !chatMode && !entering && now > idleChatAt) {
      say(Math.random() < 0.4 ? 'showcase' : 'question');
    }
    setTimeout(idleChatTick, 1000);
  }
  setTimeout(idleChatTick, 8000);
})();
