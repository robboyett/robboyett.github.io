# Mobile Layout Issues - To Do

The following issues were identified during mobile viewport testing (375px width) and need to be resolved before pushing the article live:

1. **Severe Text Wrapping & Column Squeezing:** The main article content is forced into an extremely narrow column on the left (around 120-150px wide). Text wraps aggressively, often breaking down to 1-3 words per line. This is likely caused by fixed-width elements forcing the layout viewport wider than the visual viewport.
   
2. **Horizontal Overflow & Whitespace:** There is massive empty whitespace on the right side of the screen when scrolling horizontally. The layout is still reserving space, possibly for the grid layout intended for desktop (`1fr 14rem`), despite the mobile media queries.
   
3. **Anti-patterns Grid Collapse:** The grid layout in the anti-patterns section does not stack correctly on mobile. The cards overlap each other, and the text bleeds out of the boundaries, making it completely unreadable. The container needs a single-column fallback for narrow screens.

4. **"Key Insight" Mac-Window Box Distortion:** The custom Mac window container (`.mac-window`) is forced into the narrow main column, squashing the layout and breaking the visual effect.

5. **Sidebar/References Overlap:** The reference sidebar and navigation elements overlap the main header text and article body, indicating a positioning or z-index issue, or a failure of the `.article-body` grid to collapse into a single column.

## Priority Fixes Needed:
- Remove hardcoded max-widths or padding that push the layout beyond 100vw.
- Fix the CSS Grid configuration for `.article-body` to ensure it falls back to `display: flex; flex-direction: column;` strictly on mobile.
- Adjust the `.anti-patterns-grid` layout to stack cards vertically instead of relying on absolute positioning across a fixed width container.
