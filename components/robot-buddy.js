/**
 * Robot buddy — site-wide mascot.
 *
 * He lives in a small dock, bottom right of every page (loaded by site-nav.js).
 * Click him to chat: a multi-turn thread of floating bubbles above the dock,
 * typed into a real text field. Unplug him and he wanders the page as before.
 * Lines come from the buddy API, with a small local pool for proactive chatter.
 */
(() => {
  if (window.__rbLoaded) return;
  window.__rbLoaded = true;

  const LOCAL_API = 'http://localhost:3000/api/buddy';
  const PROD_API = 'https://robo-buddy-api.vercel.app/api/buddy';
  const isLocalHost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const API_URL = window.RB_API_URL || (isLocalHost ? LOCAL_API : PROD_API);
  const LLM_MAX_PASSIVE = 8;
  const LLM_MAX_CHAT = 24;
  const LLM_TIMEOUT_MS = 15000;
  const PROACTIVE_LLM_CHANCE = { question: 0.25, showcase: 0.25, nudge: 1 };  // welcome is pool-only
  const PROACTIVE_RATE_PAUSE_MS = 5 * 60 * 1000;  // after a 429, stop poking the LLM for proactive lines
  const PASSIVE_DISMISS_MS = 6400;
  const HISTORY_MAX = 20;
  const MAX_DRAFT = 280;
  const TOUCH_ONLY = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EXP_CLASSES = ['exp-normal', 'exp-speaking', 'exp-thinking', 'exp-angry', 'exp-broken', 'exp-offline'];

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

  const MUTE_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v8.05c1.5-.74 2.5-2.26 2.5-4.02z" fill="currentColor"/><path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/></svg>`;
  const MUTED_ICON = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M15.5 8.5l7 7M22.5 8.5l-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const PLUG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const ARROW_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

  function injectDOM() {
    // Robot + the bubble he carries while wandering. Page coordinates when he is
    // away, viewport coordinates (position: fixed) while he sits in the dock.
    const wrap = document.createElement('div');
    wrap.id = 'rb-root';
    wrap.innerHTML = `
      <div id="rb-shadow"></div>
      <div id="rb-bubble" role="status">
        <p class="msg"></p>
        <div class="links"></div>
        <button type="button" class="reply">Reply</button>
      </div>
      ${BUDDY_SVG}
      ${BROKEN_SVG}
    `;
    document.body.appendChild(wrap);

    const thread = document.createElement('div');
    thread.id = 'rb-thread';
    thread.dataset.state = 'closed';
    thread.setAttribute('role', 'log');
    thread.setAttribute('aria-live', 'polite');
    thread.setAttribute('aria-label', 'Conversation with the robot');
    document.body.appendChild(thread);

    const fade = document.createElement('div');
    fade.id = 'rb-fade';
    fade.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fade);

    const dock = document.createElement('div');
    dock.id = 'rb-dock';
    dock.innerHTML = `
      <div class="rb-controls">
        <button type="button" class="rb-btn rb-ask">Ask</button>
        <button type="button" class="rb-btn rb-icon" data-rb-unplug aria-label="Unplug the robot for a wander" title="Unplug him">${PLUG_ICON}</button>
        <button type="button" class="rb-btn rb-icon" data-rb-mute="icon"></button>
      </div>
      <div class="rb-chat">
        <div class="rb-tools">
          <button type="button" class="rb-tool" data-rb-unplug>Unplug him</button>
          <button type="button" class="rb-tool" data-rb-mute="text"></button>
        </div>
        <form class="rb-form" autocomplete="off">
          <button type="button" class="rb-btn rb-icon rb-close" aria-label="Close chat">${CLOSE_ICON}</button>
          <input class="rb-input" type="text" maxlength="${MAX_DRAFT}" enterkeyhint="send" autocapitalize="sentences" aria-label="Message the robot" placeholder="Ask me anything">
        </form>
      </div>
      <button type="button" class="rb-callback">Call him back</button>
      <button type="button" class="rb-seat" aria-label="Chat with the robot"></button>
      <span class="rb-ledge" aria-hidden="true"></span>
      <span class="rb-light" aria-hidden="true"></span>
    `;
    document.body.appendChild(dock);
  }

  injectDOM();

  const root        = document.getElementById('rb-root');
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
  const replyBtn    = bubble.querySelector('.reply');
  const thread      = document.getElementById('rb-thread');
  const dockEl      = document.getElementById('rb-dock');
  const form        = dockEl.querySelector('.rb-form');
  const input       = dockEl.querySelector('.rb-input');
  const seatBtn     = dockEl.querySelector('.rb-seat');
  const fadeEl      = document.getElementById('rb-fade');

  function sget(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function sset(key, val) { try { sessionStorage.setItem(key, val); } catch (e) { /* storage blocked */ } }
  function sdel(key) { try { sessionStorage.removeItem(key); } catch (e) { /* */ } }

  /* =====================================================================
     WHERE HE IS, AND WHO IS VISITING
     ===================================================================== */
  const PATH = window.location.pathname;
  const PAGE_KIND =
    (PATH === '/' || PATH === '/index.html') ? 'home' :
    PATH.startsWith('/journal/') ? 'journal' :
    PATH.startsWith('/experiments/') ? 'experiment' : 'other';

  function clip(str, max) {
    const s = (str || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 1).trim() + '…' : s;
  }

  function pageTitle() {
    if (PAGE_KIND === 'home') return 'Home';
    const h = document.querySelector('h1.article-title, h1.experiment-title, article h1, h1');
    const fromDoc = document.title.replace(/\s*\|\s*Rob Boyett\s*$/, '');
    return clip((h && h.textContent) || fromDoc, 140) || 'this page';
  }

  // Read fresh on every request: what he's looking at changes as the visitor scrolls.
  function pageContext() {
    const sub = document.querySelector('.article-subtitle, .experiment-subtitle');
    const h2s = [...document.querySelectorAll('.article-content h2, article h2')];
    const mid = window.innerHeight * 0.5;
    let section = null;
    h2s.forEach((h) => { if (h.getBoundingClientRect().top < mid) section = h; });
    const depth = Math.min(1, (scrollY() + window.innerHeight) / Math.max(1, pageHeight()));
    return {
      path: PATH,
      kind: PAGE_KIND,
      title: pageTitle(),
      subtitle: sub ? clip(sub.textContent, 300) : null,
      headings: h2s.slice(0, 12).map((h) => clip(h.textContent, 80)),
      sectionInView: section ? clip(section.textContent, 80) : null,
      scrollDepth: Math.round(depth * 100) / 100,
    };
  }

  // Per-browser memory: lives in localStorage only, and a small slice is sent with
  // each request so he can tell a returning visitor from a new one.
  const visitor = (() => {
    const blank = { firstSeen: null, lastSeen: null, visits: 0, pagesRead: [] };
    let v = blank;
    try { v = Object.assign({}, blank, JSON.parse(localStorage.getItem('rb_visitor') || '{}')); } catch (e) { /* */ }
    if (!Array.isArray(v.pagesRead)) v.pagesRead = [];
    const today = new Date().toISOString().slice(0, 10);
    if (!v.firstSeen) v.firstSeen = today;
    if (!sget('rb_session')) { v.visits = (+v.visits || 0) + 1; sset('rb_session', '1'); }
    v.lastSeen = today;
    return v;
  })();

  function saveVisitor() {
    try { localStorage.setItem('rb_visitor', JSON.stringify(visitor)); } catch (e) { /* */ }
  }

  function notePageRead() {
    if (PAGE_KIND !== 'journal' && PAGE_KIND !== 'experiment') return;
    visitor.pagesRead = visitor.pagesRead.filter((p) => p && p.path !== PATH);
    visitor.pagesRead.push({ path: PATH, title: pageTitle(), at: visitor.lastSeen });
    visitor.pagesRead = visitor.pagesRead.slice(-20);
  }

  function visitorForApi() {
    return {
      isReturning: visitor.visits > 1,
      visits: visitor.visits,
      firstSeen: visitor.firstSeen,
      pagesRead: visitor.pagesRead.filter((p) => p.path !== PATH).slice(-8).map((p) => ({ path: p.path, title: p.title })),
    };
  }

  const context = (() => {
    const now = new Date();
    const hour = now.getHours();
    const partOfDay =
      hour < 5  ? 'night'   :
      hour < 12 ? 'morning' :
      hour < 18 ? 'afternoon' :
      hour < 22 ? 'evening' : 'night';
    let referrer = null;
    try { referrer = document.referrer ? new URL(document.referrer).hostname : null; } catch (e) { /* */ }
    if (referrer === window.location.hostname) referrer = null;
    return {
      partOfDay,
      hour,
      isReturning: visitor.visits > 1,
      language: (navigator.language || 'en').split('-')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      referrer,
      location: null,
      persona: (window.RB_PERSONA || null),   // background info about Rob (see robot-buddy-persona.js)
    };
  })();

  /* =====================================================================
     ROBOT VOICE (Web Speech API)
     Reads each message aloud in a robot voice on devices that support it.
     Entirely parallel to the visuals — no effect on pose/typing/expression.
     Silent no-op where unsupported, and stays quiet until the visitor's
     first interaction (also what browser autoplay policy requires).
     ===================================================================== */
  // Truthy check, not `'speechSynthesis' in window` — the property can exist but be
  // undefined/null on locked-down browsers, and calling into it would then throw.
  const CAN_SPEAK = !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function';
  let speechUnlocked = false;   // flipped on the first user gesture
  let robotVoice = null;        // chosen async once voices load
  let speechMuted = false;      // visitor preference; persisted in localStorage
  try { speechMuted = localStorage.getItem('rb_muted') === '1'; } catch (e) { /* */ }

  function pickRobotVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    // Prefer a genuinely robotic voice if the OS has one — but NOT the "musical"
    // novelty voices (Cellos, Bells, Pipe Organ, Good News…) which sing the words.
    // Otherwise use the system default (a plain voice) and let low pitch do the work.
    robotVoice = voices.find((v) => /zarvox|trinoids|robot|android/i.test(v.name))
              || voices.find((v) => v.default)
              || voices.find((v) => v.lang && v.lang.startsWith(context.language))
              || voices[0] || null;
  }

  function stopSpeaking() {
    if (!CAN_SPEAK) return;
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    } catch (e) { /* */ }
  }

  function speak(text) {
    if (!CAN_SPEAK || !speechUnlocked || speechMuted || !text) return;
    try {
      // Only cancel when something's actually in flight — an unconditional cancel()
      // immediately before speak() can swallow the first utterance in Chrome.
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (robotVoice) u.voice = robotVoice;
      u.rate = 1.0;
      u.pitch = 0.9;                           // slightly-below-neutral pitch: still a touch synthetic, but warm/friendly
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { /* never let speech break the buddy */ }
  }

  const muteButtons = [...dockEl.querySelectorAll('[data-rb-mute]')];

  function syncMuteButtons() {
    muteButtons.forEach((btn) => {
      if (!CAN_SPEAK) { btn.hidden = true; return; }
      btn.setAttribute('aria-pressed', speechMuted ? 'true' : 'false');
      if (btn.dataset.rbMute === 'icon') {
        btn.setAttribute('aria-label', speechMuted ? 'Unmute robot voice' : 'Mute robot voice');
        btn.title = speechMuted ? 'Unmute him' : 'Mute him';
        btn.innerHTML = speechMuted ? MUTED_ICON : MUTE_ICON;
      } else {
        btn.textContent = speechMuted ? 'Unmute him' : 'Mute him';
      }
    });
  }

  muteButtons.forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    speechMuted = !speechMuted;
    try { localStorage.setItem('rb_muted', speechMuted ? '1' : '0'); } catch (err) { /* */ }
    if (speechMuted) stopSpeaking();
    syncMuteButtons();
  }));
  syncMuteButtons();

  if (CAN_SPEAK) {
    pickRobotVoice();
    speechSynthesis.addEventListener('voiceschanged', pickRobotVoice);
    // Unlock on the first user gesture, and prime the engine from inside that gesture
    // with a silent utterance: Safari only permits speech that traces back to a user
    // action, and this warms Chrome so the first real line isn't dropped.
    const unlock = () => {
      if (speechUnlocked) return;
      speechUnlocked = true;
      try {
        const warm = new SpeechSynthesisUtterance(' ');
        warm.volume = 0;
        speechSynthesis.resume();
        speechSynthesis.speak(warm);
      } catch (e) { /* */ }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('mousemove', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  /* =====================================================================
     STATE
     ===================================================================== */
  let catalog = { experiments: [], journal: [] };
  let chatOpen = false;
  let pendingOpen = false;           // open the chat once he's back in the dock
  let failReturn = null;
  let typeTimer = null;
  let peekTimer = null;
  let restTimer = null;
  let proactiveLlmPausedUntil = 0;   // set when a 429 is seen; proactive chatter goes pool-only until then

  // Session memory — survives page-to-page navigation within a visit so the thread
  // follows the visitor round the site (the shared, cross-visitor memory is
  // maintained server-side). Items: { role: 'buddy'|'visitor'|'moved', text, links? }.
  function loadHistory() {
    try {
      const h = JSON.parse(sget('rb_history') || '[]');
      return Array.isArray(h) ? h.filter((i) => i && typeof i.text === 'string') : [];
    } catch (e) { return []; }
  }
  function persistHistory() {
    conversationHistory = conversationHistory.slice(-HISTORY_MAX);
    sset('rb_history', JSON.stringify(conversationHistory));
  }
  let conversationHistory = loadHistory();

  // What the API sees: real turns only, text only.
  function historyForApi() {
    return conversationHistory
      .filter((i) => i.role === 'buddy' || i.role === 'visitor')
      .map((i) => ({ role: i.role, text: i.text }));
  }

  // Mark the move in the thread when the visitor arrives on a new page mid-conversation.
  (function notePageChange() {
    const last = sget('rb_path');
    sset('rb_path', PATH);
    if (!last || last === PATH) return;
    if (!conversationHistory.some((i) => i.role === 'visitor')) return;
    const tail = conversationHistory[conversationHistory.length - 1];
    if (tail && tail.role === 'moved') conversationHistory.pop();
    conversationHistory.push({ role: 'moved', text: pageTitle() });
    persistHistory();
  })();

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

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const W = 48, H = 67;
  const half = { x: W / 2, y: H / 2 };

  const scrollX = () => window.scrollX || window.pageXOffset || 0;
  const scrollY = () => window.scrollY || window.pageYOffset || 0;
  const pageWidth = () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const pageHeight = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

  /* =====================================================================
     DOCK
     'docked'    seated on the ledge, viewport-anchored
     'away'      unplugged and wandering the page (page coordinates)
     'returning' flying back to the dock
     ===================================================================== */
  let mode = (!REDUCE_MOTION && sget('rb_mode') === 'away') ? 'away' : 'docked';

  const dockGap = () => (window.innerWidth <= 480 ? 16 : 24);

  // On phones the on-screen keyboard covers the bottom of the layout viewport;
  // lift the dock (and everything stacked on it) by the covered amount.
  function keyboardInset() {
    const vv = window.visualViewport;
    if (!vv) return 0;
    return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  }
  function syncKeyboardInset() {
    document.documentElement.style.setProperty('--rb-kb', `${keyboardInset()}px`);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncKeyboardInset);
    window.visualViewport.addEventListener('scroll', syncKeyboardInset);
  }
  syncKeyboardInset();

  // The ground colour under him, for the fade behind the phone input row.
  (function syncGround() {
    const clear = (c) => !c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);
    let c = getComputedStyle(document.body).backgroundColor;
    if (clear(c)) c = getComputedStyle(document.documentElement).backgroundColor;
    if (clear(c)) c = '#ffffff';
    document.documentElement.style.setProperty('--rb-ground', c);
  })();

  // Centre of the robot when seated, in viewport coordinates. His yellow base
  // dips 3px behind the ledge (the ledge is 56 x 6, flush with the dock corner).
  function seatPos() {
    const g = dockGap();
    return {
      x: document.documentElement.clientWidth - g - 28,
      y: window.innerHeight - g - keyboardInset() - 6 - 24,
    };
  }

  function syncDock() {
    dockEl.classList.toggle('is-docked', mode === 'docked');
    dockEl.classList.toggle('is-away', mode !== 'docked');
    dockEl.classList.toggle('is-open', chatOpen);
    root.classList.toggle('rb-fixed', mode === 'docked');
    buddy.classList.toggle('rb-seated', mode === 'docked');
    seatBtn.setAttribute('aria-label', chatOpen ? 'Close chat with the robot' : 'Chat with the robot');
    seatBtn.setAttribute('aria-expanded', chatOpen ? 'true' : 'false');
    fadeEl.classList.toggle('show', chatOpen);
  }

  let entering = mode === 'away';   // an unplugged robot potters in from off-canvas on load
  let pos = mode === 'away'
    ? { x: scrollX() - 90, y: scrollY() + window.innerHeight * 0.55 }
    : seatPos();
  let vel = { x: 0, y: 0 };
  let target = { x: pos.x, y: pos.y };
  let facing = 1;
  let wmode = 'potter';             // how he moves while away: potter | approach | flee
  let mouse = { x: pos.x, y: pos.y };
  let pointerClient = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let mouseStillSince = performance.now();
  let lastPointer = { x: mouse.x, y: mouse.y };
  let pickWanderAt = 0;
  let approachRepickAt = 0;
  let gaze = { x: pos.x - 100, y: pos.y };
  let idleGaze = { x: pos.x - 100, y: pos.y };
  let gazePickAt = 0;
  let fleeUntil = 0;
  let startle = 0;
  let t = 0;
  let bubbleOpen = false;           // the bubble he carries while away
  let idleChatAt = performance.now() + 6000 + Math.random() * 6000;
  let autoDismiss = null;
  let sayInFlight = false;
  let expression = 'normal';

  buddy.classList.add('exp-normal');
  function setExpression(name) {
    if (expression === name) return;
    expression = name;
    EXP_CLASSES.forEach((c) => buddy.classList.toggle(c, c === `exp-${name}`));
    dockEl.classList.toggle('is-offline', name === 'offline' || name === 'broken');
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
      if (wmode === 'approach') wmode = 'potter';
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

  // Poke him while he's out wandering and he darts away.
  buddy.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mode !== 'away') return;
    const away = Math.atan2(pos.y - mouse.y, pos.x - mouse.x);
    vel.x += Math.cos(away) * 9;
    vel.y += Math.sin(away) * 9;
    wmode = 'flee';
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
  if (mode === 'away') {
    newWanderTarget();
    // Override the first stop: amble in to a spot in the left of the view, then wander.
    target.x = scrollX() + Math.min(260, window.innerWidth * 0.22);
    target.y = pos.y;
  }

  function settleInDock() {
    mode = 'docked';
    sset('rb_mode', 'docked');
    pos = seatPos();
    vel.x = 0; vel.y = 0;
    facing = 1;
    syncDock();
    if (pendingOpen) { pendingOpen = false; openChat(); }
  }

  function unplug() {
    if (REDUCE_MOTION || mode !== 'docked') return;
    closeChat();
    clearTimeout(peekTimer);
    setThread('closed');
    const s = seatPos();
    mode = 'away';
    sset('rb_mode', 'away');
    pos = { x: s.x + scrollX(), y: s.y + scrollY() };   // viewport → page coordinates
    vel = { x: -4, y: -8 };                              // hop up off the ledge
    entering = false;
    wmode = 'potter';
    startle = 1;
    newWanderTarget();
    idleChatAt = performance.now() + 9000 + Math.random() * 6000;
    setExpression('normal');
    syncDock();
  }

  function callBack() {
    if (mode !== 'away') return;
    dismissBubble(false);
    entering = false;
    mode = 'returning';
    sset('rb_mode', 'docked');
    syncDock();
  }

  let blinkUntil = 0;
  function maybeBlink(now) {
    if (now > blinkUntil && Math.random() < 0.004) blinkUntil = now + 130;
  }

  function approachStillThreshold() {
    return TOUCH_ONLY ? 4000 : 1800;
  }

  function frame(now) {
    t += 1;
    const seated = mode === 'docked';

    if (seated) {
      const s = seatPos();
      pos.x = s.x; pos.y = s.y;
      vel.x = 0; vel.y = 0;
    }

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

    if (mode === 'returning') {
      // Fly home: a firmer pull than wandering, straight at the seat.
      const s = seatPos();
      const dx = s.x + scrollX() - pos.x;
      const dy = s.y + scrollY() - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        settleInDock();
      } else if (dist < 90) {
        // Final approach: ease straight onto the seat rather than orbiting it.
        vel.x = dx * 0.14; vel.y = dy * 0.14;
        pos.x += vel.x; pos.y += vel.y;
      } else {
        vel.x += dx * 0.003;
        vel.y += dy * 0.003;
        vel.x *= 0.88; vel.y *= 0.88;
        pos.x += vel.x; pos.y += vel.y;
      }
    } else if (mode === 'away') {
      const stillFor = now - mouseStillSince;
      if (!bubbleOpen && wmode !== 'flee' && !entering) {
        if (stillFor > approachStillThreshold()) wmode = 'approach';
        else if (wmode !== 'approach') wmode = 'potter';
      }
      if (wmode === 'flee' && now > fleeUntil) wmode = 'potter';

      if (!bubbleOpen) {
        if (wmode === 'approach') {
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
        } else if (wmode === 'potter' && now > pickWanderAt) {
          newWanderTarget();
        }
        if (wmode !== 'flee') {
          const dx = target.x - pos.x;
          const dy = target.y - pos.y;
          const dist = Math.hypot(dx, dy);
          // Lower pull + approach gentler than potter, so he ambles over.
          const pull = wmode === 'approach' ? 0.005 : 0.006;
          const settle = wmode === 'approach' ? 30 : 4;
          if (dist > settle) {
            vel.x += dx * pull * 0.035;
            vel.y += dy * pull * 0.035;
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
    }

    // Still inside this frame he may have just landed in the dock.
    const sitting = mode === 'docked';
    const speed = Math.hypot(vel.x, vel.y);
    if (!sitting && Math.abs(vel.x) > 0.3) facing = vel.x > 0 ? 1 : -1;

    const moving = speed > 0.35;
    let float = sitting
      ? (REDUCE_MOTION ? 0 : Math.sin(t * 0.045) * 0.7)        // a slow breath on the ledge
      : Math.sin(t * 0.06) * 3 + (moving ? Math.sin(t * 0.3) * 1.5 : 0);
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
    if (sitting) {
      shadow.style.opacity = '0';
    } else {
      shadow.style.transform =
        `translate(${pos.x - 18}px, ${pos.y + half.y - 6}px) scale(${1 - float * 0.04}, 1)`;
      shadow.style.opacity = String(0.85 - Math.abs(float) * 0.05);
    }
    body.style.transform = `rotate(${lean * 0.25}deg) scale(${sx}, ${sy})`;
    chest.style.transform = `scaleX(${facing})`;   // keep chest lines on the right when he flips

    // Gaze: he favours the cursor when it's moving or when he's heading that
    // way, but otherwise lets his eyes wander to whatever he's drifting toward.
    // Seated, `pos` is in viewport coordinates, so compare against the client pointer.
    const mp = sitting ? pointerClient : mouse;
    const cursorActive = (now - mouseStillSince) < 1600;
    const toMouseX = mp.x - pos.x;
    const toMouseY = mp.y - pos.y;
    const headingToCursor =
      (!sitting && wmode === 'approach') ||
      (moving && (vel.x * toMouseX + vel.y * toMouseY) > 0 && Math.hypot(toMouseX, toMouseY) < 380);
    if (cursorActive || headingToCursor) {
      gaze.x += (mp.x - gaze.x) * 0.12;
      gaze.y += (mp.y - gaze.y) * 0.12;
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
    head.style.transform =
      `rotate(${-lean * 0.16 + headExtraRot}deg) translate(${lookX * facing}px, ${lookY}px)`;

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
    } else if (!sitting && wmode === 'flee') {
      armL.style.transformOrigin = '9px 63px';
      armL.style.transform = 'rotate(-38deg)';
      armR.style.transform = 'rotate(38deg)';
    } else {
      armL.style.transformOrigin = '9px 63px';
      armL.style.transform = `rotate(${armSway}deg)`;
      armR.style.transform = `rotate(${-armSway}deg)`;
    }
    dangle.style.transform = sitting ? '' : `rotate(${Math.sin(t * 0.06) * 2.5 - vel.x * 1.2}deg)`;

    if (bubbleOpen) positionBubble();
    requestAnimationFrame(frame);
  }
  // Place him before the first paint so he doesn't flash at (0,0).
  syncDock();
  buddy.style.transform = `translate(${pos.x - half.x}px, ${pos.y - half.y}px) scaleX(1)`;
  shadow.style.opacity = '0';
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    syncKeyboardInset();
    if (mode !== 'away') return;
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

  /* =====================================================================
     LINES: the API, with a small local pool for proactive chatter
     ===================================================================== */
  function getLlmCallCount(key) {
    return +sget(key) || 0;
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
        body: JSON.stringify({
          kind,
          context,
          page: pageContext(),
          visitor: visitorForApi(),
          state: { mode: mode === 'away' ? 'away' : 'docked', muted: speechMuted },
          catalog,
          history: historyForApi(),
          ...extra,
        }),
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
      sset(key, String(getLlmCallCount(key) + 1));
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
      { text: `Good ${context.partOfDay}. I live down here now. Ask me anything about Rob's work.`, links: [] },
      { text: "Oh, hello. I'm Rob's robot. Give me a poke if you want to chat.", links: [] },
    ],
    question: [
      { text: 'Random thought: do you think better moving, or sitting still?', links: [] },
      { text: "If you could keep just one tab open forever, what'd be on it?", links: [] },
    ],
    nudge: [
      { text: 'I know this one well. Ask me anything about it.', links: [] },
      { text: 'Want the short version of this one?', links: [] },
    ],
    showcase: [
      'There is a piece I keep coming back to.',
      'If you fancy a read, this is a good one.',
    ],
  };

  function pooledMessage(kind) {
    if (kind === 'showcase') {
      // Point at a real article from the live catalogue, never a hardcoded one.
      const others = catalog.journal.filter((e) => e.url !== PATH);
      if (!others.length) return pickRandom(POOL.question);
      const pick = pickRandom(others);
      return { text: pickRandom(POOL.showcase), links: [{ label: clip(pick.title, 40), goto: pick.url, sendoff: "It's this way." }] };
    }
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
      const llm = await fetchLlmMessage('chat', extra);
      if (!llm.text) noteRateLimit(llm.fail);
      return llm.text ? llm : { fail: llm.fail };
    }
    // Proactive: mostly the pregenerated pool, sometimes the LLM — and never the
    // LLM while we're backing off from a recent rate-limit.
    const chance = PROACTIVE_LLM_CHANCE[kind] || 0;
    const mayUseLlm = chance > 0 && canCallLlm(kind) && performance.now() >= proactiveLlmPausedUntil;
    if (mayUseLlm && Math.random() < chance) {
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

  // Let the raised arm and talking face settle once he has finished a line.
  function restAfterSpeaking(delay = 1600) {
    clearTimeout(restTimer);
    restTimer = setTimeout(() => {
      if (expression === 'speaking' || expression === 'angry') setExpression('normal');
    }, delay);
  }

  function typeInto(el, full, onStep, onDone) {
    clearTimeout(typeTimer);
    if (REDUCE_MOTION || full.length <= 1) { el.textContent = full; onDone(); return; }
    el.textContent = '';
    let i = 0;
    const step = () => {
      i += 1;
      el.textContent = full.slice(0, i);
      if (onStep) onStep();
      if (i < full.length) typeTimer = setTimeout(step, 22 + Math.random() * 34);
      else { typeTimer = null; onDone(); }
    };
    typeTimer = setTimeout(step, 60);
  }

  function navigateTo(url) {
    if (chatOpen) sset('rb_chat_open', '1');
    setTimeout(() => { window.location.href = url; }, 220);
  }

  /* =====================================================================
     THE THREAD: floating bubbles above the dock
     data-state: closed | peek (latest line only) | open (the conversation)
     ===================================================================== */
  function setThread(state) {
    thread.dataset.state = state;
  }

  function itemEl(item) {
    if (item.role === 'moved') {
      const m = document.createElement('div');
      m.className = 'rb-moved';
      m.textContent = `Moved to ${item.text}`;
      return m;
    }
    const wrap = document.createElement('div');
    wrap.className = `rb-item ${item.role === 'visitor' ? 'rb-from-visitor' : 'rb-from-buddy'}`;
    const b = document.createElement('div');
    b.className = 'rb-bubble';
    b.textContent = item.text;
    wrap.appendChild(b);
    (item.links || []).forEach((link) => {
      if (!link || !link.goto) return;
      const a = document.createElement('a');
      a.className = 'rb-chip';
      a.href = link.goto;
      const label = document.createElement('span');
      label.textContent = link.label || 'Take a look';
      a.appendChild(label);
      a.insertAdjacentHTML('beforeend', ARROW_ICON);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateTo(link.goto);
      });
      wrap.appendChild(a);
    });
    return wrap;
  }

  function renderThread() {
    thread.innerHTML = '';
    conversationHistory.forEach((item) => thread.appendChild(itemEl(item)));
  }

  function pushItem(item) {
    conversationHistory.push(item);
    persistHistory();
    renderThread();
    return thread.lastElementChild;
  }

  function showLoading() {
    removeLoading();
    const wrap = document.createElement('div');
    wrap.className = 'rb-item rb-from-buddy rb-loading';
    wrap.innerHTML = '<div class="rb-bubble">…</div>';
    thread.appendChild(wrap);
  }

  function removeLoading() {
    thread.querySelectorAll('.rb-loading').forEach((el) => el.remove());
  }

  // He says a line into the thread: typed out, spoken aloud, face to match.
  function pushBuddyLine(message, onDone) {
    const full = message.text || '';
    speak(full);
    setExpression(expressionFor(message));
    const el = pushItem({ role: 'buddy', text: full, links: (message.links || []).slice(0, 2) });
    el.classList.add('rb-typing');
    typeInto(el.querySelector('.rb-bubble'), full, null, () => {
      el.classList.remove('rb-typing');
      restAfterSpeaking();
      if (onDone) onDone();
    });
  }

  // A proactive line while docked: one bubble that tidies itself away.
  function showPeek(message) {
    clearTimeout(peekTimer);
    setThread('peek');
    pushBuddyLine(message, () => {
      peekTimer = setTimeout(() => {
        if (!chatOpen) setThread('closed');
      }, PASSIVE_DISMISS_MS);
    });
  }

  function openChat(opts = {}) {
    if (mode !== 'docked') {            // chatting happens at the dock: fetch him first
      pendingOpen = true;
      callBack();
      return;
    }
    if (chatOpen) return;
    clearTimeout(peekTimer);
    chatOpen = true;
    sset('rb_chat_open', '1');
    renderThread();
    setThread('open');
    syncDock();
    if (!conversationHistory.length && !sayInFlight) pushBuddyLine(pooledMessage('welcome'));
    if (opts.focus !== false) {
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    }
  }

  function closeChat() {
    if (!chatOpen) return;
    chatOpen = false;
    sdel('rb_chat_open');
    setThread('closed');
    syncDock();
    input.blur();
  }

  async function submitChat() {
    const text = input.value.trim().slice(0, MAX_DRAFT);
    if (!text || sayInFlight) return;

    const history = historyForApi();   // the turns before this one; the new line travels as `message`
    input.value = '';
    clearTimeout(typeTimer);
    pushItem({ role: 'visitor', text });

    sayInFlight = true;
    setExpression('thinking');
    showLoading();

    try {
      const message = await getNextMessage('chat', { message: text, history });
      removeLoading();
      if (message.text) pushBuddyLine(message);
      else showChatFailure(message.fail);
    } finally {
      sayInFlight = false;
    }
  }

  // Chat failure — no words, the face carries it. The field stays open to retry.
  function showChatFailure(fail) {
    const expr = (fail === 'offline' || fail === 'cap') ? 'offline' : 'broken';
    setExpression(expr);
    clearTimeout(failReturn);
    failReturn = setTimeout(() => {
      if (expression === expr) setExpression('normal');
    }, 3600);
  }

  /* =====================================================================
     THE BUBBLE HE CARRIES WHILE AWAY
     ===================================================================== */
  function showAwayBubble(message) {
    const full = message.text || '';
    speak(full);
    setExpression(expressionFor(message));
    conversationHistory.push({ role: 'buddy', text: full, links: (message.links || []).slice(0, 2) });
    persistHistory();

    bubbleLinks.innerHTML = '';
    replyBtn.hidden = true;
    bubbleMsg.textContent = '';
    positionBubble();
    requestAnimationFrame(() => bubble.classList.add('show'));
    bubbleOpen = true;
    vel.x = 0;
    vel.y = 0;
    clearTimeout(autoDismiss);

    typeInto(bubbleMsg, full, positionBubble, () => {
      (message.links || []).slice(0, 2).forEach((link) => {
        if (!link || !link.goto) return;
        const a = document.createElement('button');
        a.type = 'button';
        a.className = 'link-go';
        a.textContent = `${link.label || 'Take a look'} →`;
        a.addEventListener('click', (e) => { e.stopPropagation(); navigateTo(link.goto); });
        bubbleLinks.appendChild(a);
      });
      replyBtn.hidden = false;
      positionBubble();
      restAfterSpeaking();
      autoDismiss = setTimeout(() => dismissBubble(), PASSIVE_DISMISS_MS);
    });
  }

  function dismissBubble(resetIdle = true) {
    clearTimeout(autoDismiss);
    if (bubbleOpen) clearTimeout(typeTimer);
    bubble.classList.remove('show');
    bubbleOpen = false;
    if (expression === 'speaking' || expression === 'thinking') setExpression('normal');
    if (resetIdle) idleChatAt = performance.now() + 12000 + Math.random() * 10000;
  }

  // Proactive chatter: a peek bubble at the dock, or the carried bubble when away.
  async function say(kind) {
    if (chatOpen || sayInFlight || bubbleOpen || mode === 'returning') return;
    sayInFlight = true;
    try {
      const message = await getNextMessage(kind);
      if (!message || !message.text || chatOpen || mode === 'returning') return;
      if (mode === 'docked') showPeek(message);
      else showAwayBubble(message);
    } finally {
      sayInFlight = false;
    }
  }

  /* =====================================================================
     WIRING
     ===================================================================== */
  seatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (chatOpen) closeChat(); else openChat();
  });

  dockEl.querySelector('.rb-ask').addEventListener('click', (e) => { e.stopPropagation(); openChat(); });
  dockEl.querySelector('.rb-close').addEventListener('click', (e) => { e.stopPropagation(); closeChat(); });
  dockEl.querySelector('.rb-callback').addEventListener('click', (e) => { e.stopPropagation(); callBack(); });
  dockEl.querySelectorAll('[data-rb-unplug]').forEach((btn) => {
    if (REDUCE_MOTION) { btn.hidden = true; return; }
    btn.addEventListener('click', (e) => { e.stopPropagation(); unplug(); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitChat();
  });

  // A peeking bubble is an invitation: click it to carry on the conversation.
  thread.addEventListener('click', (e) => {
    if (thread.dataset.state !== 'peek' || e.target.closest('.rb-chip')) return;
    openChat();
  });

  replyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openChat();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOpen) { e.preventDefault(); closeChat(); }
  });

  window.addEventListener('mousedown', (e) => {
    const inside = (el) => el.contains(e.target);
    if (chatOpen && !inside(thread) && !inside(dockEl) && !inside(buddy)) closeChat();
    if (bubbleOpen && !inside(bubble) && !inside(buddy)) dismissBubble();
  });

  /* =====================================================================
     START
     ===================================================================== */
  notePageRead();
  saveVisitor();

  // The conversation was open when the visitor followed a link: keep it open.
  if (mode === 'docked' && sget('rb_chat_open') === '1') {
    openChat({ focus: false });
  }

  // One greeting per visit; after that, one nudge per article.
  setTimeout(function greetWhenReady() {
    if (entering) { setTimeout(greetWhenReady, 400); return; }
    if (!sget('rb_welcomed')) {
      sset('rb_welcomed', '1');
      say('welcome');
      return;
    }
    if (PAGE_KIND !== 'journal') return;
    let nudged = [];
    try { nudged = JSON.parse(sget('rb_nudged') || '[]'); } catch (e) { /* */ }
    if (nudged.includes(PATH)) return;
    setTimeout(() => {
      if (chatOpen || mode !== 'docked') return;
      nudged.push(PATH);
      sset('rb_nudged', JSON.stringify(nudged.slice(-40)));
      say('nudge');
    }, 12000);
  }, 2200);

  // Out of the dock he is chattier, as he always was.
  function idleChatTick() {
    const now = performance.now();
    if (mode === 'away' && !bubbleOpen && !sayInFlight && !entering && now > idleChatAt) {
      idleChatAt = now + 12000 + Math.random() * 10000;
      say(Math.random() < 0.4 ? 'showcase' : 'question');
    }
    setTimeout(idleChatTick, 1000);
  }
  setTimeout(idleChatTick, 8000);
})();
