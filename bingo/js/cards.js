/* ======================================================================
   AI Bingo — Printable Cards
   Generates N unique 5x5 bingo cards from the AI_BINGO_TERMS pool,
   laid out two per A4 page for clean home printing.
   ====================================================================== */

(function () {
  "use strict";

  const TERMS = (window.AI_BINGO_TERMS || []).map((t) => t.term);
  const CARDS_PER_PAGE = 2;
  const CELLS_PER_CARD = 25;
  const CENTER_INDEX = 12; // middle of the 5x5 grid (0-indexed)
  const TERMS_PER_CARD = CELLS_PER_CARD - 1; // leave centre for FREE

  const cardsEl = document.getElementById("cards");
  const countInput = document.getElementById("card-count");
  const regenBtn = document.getElementById("regenerate");
  const printBtn = document.getElementById("print");

  /* ----------------------------- Utilities ----------------------------- */

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickTermsForCard() {
    if (TERMS.length >= TERMS_PER_CARD) {
      return shuffle(TERMS).slice(0, TERMS_PER_CARD);
    }
    // Fallback if we ever have fewer than 24 terms — pad with repeats.
    const out = [];
    while (out.length < TERMS_PER_CARD) {
      const more = shuffle(TERMS);
      for (const t of more) {
        if (out.length >= TERMS_PER_CARD) break;
        out.push(t);
      }
    }
    return out;
  }

  function pad(num, size) {
    let s = String(num);
    while (s.length < size) s = "0" + s;
    return s;
  }

  /* ----------------------------- Building ----------------------------- */

  function buildCard(cardNumber) {
    const terms = pickTermsForCard();
    // Insert FREE in the centre cell.
    terms.splice(CENTER_INDEX, 0, null);

    const card = document.createElement("article");
    card.className = "card";

    // Header (BINGO + serial)
    const header = document.createElement("div");
    header.className = "card__header";
    const title = document.createElement("div");
    title.className = "card__title";
    title.textContent = "BINGO";
    header.appendChild(title);

    const idEl = document.createElement("div");
    idEl.className = "card__id";
    idEl.textContent = "CARD " + pad(cardNumber, 3);
    header.appendChild(idEl);

    // 5x5 grid
    const grid = document.createElement("div");
    grid.className = "card__grid";

    terms.forEach((term, idx) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (idx === CENTER_INDEX) {
        cell.classList.add("cell--free");
        const label = document.createElement("span");
        label.className = "cell__free-label";
        label.textContent = "FREE";
        cell.appendChild(label);
        const sub = document.createElement("span");
        sub.className = "cell__free-sub";
        sub.textContent = pad(cardNumber, 5);
        cell.appendChild(sub);
      } else {
        cell.textContent = term.toUpperCase();
      }
      grid.appendChild(cell);
    });

    // Footer
    const footer = document.createElement("div");
    footer.className = "card__footer";
    const left = document.createElement("span");
    left.textContent = "AI BINGO";
    const right = document.createElement("span");
    right.className = "card__brand";
    right.textContent = "Bayer Workshop · Day 1";
    footer.appendChild(left);
    footer.appendChild(right);

    card.appendChild(header);
    card.appendChild(grid);
    card.appendChild(footer);
    return card;
  }

  function buildAll(count) {
    cardsEl.innerHTML = "";
    let page = null;
    for (let i = 0; i < count; i++) {
      if (i % CARDS_PER_PAGE === 0) {
        page = document.createElement("section");
        page.className = "page";
        cardsEl.appendChild(page);
      }
      page.appendChild(buildCard(i + 1));
    }
    // After the DOM is in, fit text in every cell so long terms wrap nicely.
    requestAnimationFrame(fitAllCells);
  }

  /* ------------------------- Cell text fitting ------------------------- */
  // Auto-shrinks a cell's font-size so the term fits without breaking words.

  let measureCtx = null;
  function getMeasureCtx() {
    if (measureCtx) return measureCtx;
    const c = document.createElement("canvas");
    measureCtx = c.getContext("2d");
    return measureCtx;
  }

  function fitCell(cell) {
    if (cell.classList.contains("cell--free")) return;
    const text = (cell.textContent || "").trim();
    if (!text) return;

    const cw = cell.clientWidth;
    const ch = cell.clientHeight;
    if (!cw || !ch) return;

    // Inner area: leave a ~12% breathing margin for the cell border / padding.
    const innerW = cw * 0.86;
    const innerH = ch * 0.86;

    const styles = window.getComputedStyle(cell);
    const fontFamily = styles.fontFamily || "sans-serif";
    const fontWeight = styles.fontWeight || "800";

    const words = text.split(/\s+/).filter(Boolean);
    const ctx = getMeasureCtx();

    // Measure widest single word at a reference 100px font-size — that
    // tells us the maximum size at which any word still fits on one line.
    ctx.font = `${fontWeight} 100px ${fontFamily}`;
    let widestAt100 = 0;
    for (const w of words) {
      const m = ctx.measureText(w).width;
      if (m > widestAt100) widestAt100 = m;
    }

    // Hard cap based on width — the longest word must fit.
    const sizeByWidth = (innerW / widestAt100) * 100;

    // Cap based on the number of words — assume worst case is one word
    // per line, with ~1.05 line-height. That guarantees vertical fit.
    const lineHeight = 1.1;
    const maxLines = Math.max(1, words.length);
    const sizeByHeight = innerH / (maxLines * lineHeight);

    // Sensible bounds for printing.
    const MAX = 22; // px — nicely chunky for short single-word terms
    const MIN = 8;  // px — readable floor for the very longest terms

    const target = Math.min(sizeByWidth, sizeByHeight, MAX);
    const final = Math.max(MIN, Math.floor(target));
    cell.style.fontSize = final + "px";
  }

  function fitAllCells() {
    const cells = cardsEl.querySelectorAll(".cell");
    cells.forEach(fitCell);
  }

  /* ------------------------------ Wiring ------------------------------ */

  function regenerate() {
    let n = parseInt(countInput.value, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > 200) n = 200;
    countInput.value = String(n);
    buildAll(n);
  }

  regenBtn.addEventListener("click", regenerate);

  printBtn.addEventListener("click", () => {
    // Re-fit just in case the user resized the window before printing.
    fitAllCells();
    requestAnimationFrame(() => window.print());
  });

  countInput.addEventListener("change", regenerate);

  // Re-fit when web fonts finish loading (measurements are font-dependent).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitAllCells).catch(() => {});
  }

  // Re-fit before printing for browsers that go through the system dialog.
  window.addEventListener("beforeprint", fitAllCells);

  // Initial render.
  regenerate();
})();
