# AI Bingo

A kitsch, retro bingo-cage spinner for your AI workshop. Press the big red **SPIN!** button, the cage rattles, a ball pops out with an AI term, and a card slides up explaining what it means. Close it, hand out the prize if anyone got a line, and spin again.

- Pure HTML / CSS / JavaScript — no build step, no dependencies.
- Each term is drawn at most once per round (random order, no repeats).
- A counter shows how many terms are still in the cage.
- State is saved in your browser, so an accidental refresh won't reset the round.
- A **Reset round** button puts every term back in the cage when you're ready for a new game.
- Game-show style sound effects: ratcheting wheel ticks during the spin, a bell ding on the reveal, an arpeggio when the card pops, and a jackpot fanfare when the cage is empty.
- Hit **Spacebar** as a shortcut for SPIN!, **Esc** to close the term card, **M** to mute/unmute. The yellow speaker button in the top-right toggles sounds and remembers your choice.
- Need physical bingo cards too? Click the **Cards** button in the top bar (or open `cards.html`) to print 20 unique randomised 5×5 cards, two per A4, black-and-white, ready for a home printer.

## Run it on your Mac

The simplest way — just double-click `index.html`. It will open in your default browser and work fine for the workshop.

If you'd rather serve it over `http://` (some browsers handle local storage and fonts a touch more cleanly that way), open Terminal in this folder and run one of:

```bash
# Python 3 (already on macOS)
python3 -m http.server 8000

# or, if you have Node installed:
npx serve .
```

Then visit <http://localhost:8000> in your browser.

## Editing the term list

All terms and their explanations live in [`js/terms.js`](js/terms.js). Each entry looks like:

```js
{
  term: "RAG",
  short: "Retrieval-Augmented Generation",
  description: "Before answering, the system retrieves relevant snippets..."
}
```

Add, remove or tweak entries to match your audience. Save and refresh the page.

> Tip: if you change the list mid-workshop, also click **Reset round** so the new entries get included in the draw.

## File layout

```
AI Bingo v2/
├── index.html       # the spinner page
├── cards.html       # printable bingo cards (A4, 2 per page, B&W)
├── css/
│   ├── styles.css   # all the kitsch styling for the spinner
│   └── cards.css    # print-friendly styling for the cards
├── js/
│   ├── terms.js     # the AI terms + explanations (edit me!)
│   ├── sounds.js    # synthesised game-show sound effects (Web Audio API)
│   ├── app.js       # spinner / modal / no-repeat logic
│   └── cards.js     # randomised card generation + auto-fitting cell text
└── README.md
```

## Printing the bingo cards

1. Open `cards.html` (or click the **Cards** button on the spinner page).
2. Set how many cards you want (defaults to 20) and hit **Regenerate** until you're happy.
3. Click **Print**. In the print dialog choose **A4 portrait** and turn **off** "Headers and footers" for the cleanest look — default margins are fine.

Cards are pure black and white so any home printer is happy. Each card has a serial number under the FREE square so you can identify the winner.

Have fun, and good luck explaining "diffusion model" with a straight face.
