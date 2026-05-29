#!/usr/bin/env python3
"""
Extract individual character figures from the raw illustration sheets.

Approach:
  - Load each sheet, knock out the near-white background -> transparent.
  - Split the sheet into N horizontal slices (one per figure).
  - For each slice, tighten to the figure's actual bounding box.
  - Save as a transparent PNG.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).parent
RAW = ROOT / "raw-illos"
OUT = ROOT / "figures"
OUT.mkdir(exist_ok=True)

# Sheets and the names we want for each figure, in left-to-right order.
SHEETS = {
    # Mixed / hero composition: bankers left, robot middle, customers right.
    "c4dc239d4f1290e8bffaaa22f60fee8c8248e2f3177013cea634f03ef2701692.png": [
        "banker-man-suit",
        "banker-woman-suit",
        "robot",
        "customer-older-puffer",
        "customer-woman-casual",
        "customer-man-casual",
    ],
    # All bankers: 5 suited professionals + robot in middle.
    "817ac5146389baeb6f69e3537d6cd485ad3d7c09aea55d7e7789583aa55532f4.png": [
        "banker-man-suit-alt",
        "banker-woman-files",
        "banker-man-glasses-briefcase",
        "robot-bankers-sheet",
        "banker-woman-skirt",
        "banker-man-bearded",
    ],
    # Mostly customers + robot in middle.
    "7103d889be5bf4dd5c7887089dc6c9a9d23c4ef2f106142f3a5349e68050b224.png": [
        "customer-man-sweater",
        "customer-woman-bag",
        "customer-older-puffer-alt",
        "robot-customers-sheet",
        "customer-woman-spotted",
        "customer-man-shirt",
    ],
}

# Anything brighter than this in all RGB channels is treated as background.
BG_THRESHOLD = 235


def knockout_background(img: Image.Image) -> Image.Image:
    """Convert near-white pixels to transparent. Preserves anti-aliased lines."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= BG_THRESHOLD and g >= BG_THRESHOLD and b >= BG_THRESHOLD:
                px[x, y] = (255, 255, 255, 0)
    return img


def find_figure_columns(img: Image.Image) -> list[tuple[int, int]]:
    """
    Walk the alpha channel column-by-column. Group runs of non-empty columns
    into figure bands, treating short transparent stretches as part of the
    same figure (handles small detached marks like dropped shadows).
    """
    alpha = img.split()[-1]
    w, h = img.size
    col_has_ink = []
    for x in range(w):
        col = alpha.crop((x, 0, x + 1, h))
        col_has_ink.append(col.getbbox() is not None)

    # Find contiguous bands of ink, gluing short gaps.
    GLUE_PX = 12
    bands: list[list[int]] = []
    in_band = False
    band_start = 0
    gap = 0
    for x, ink in enumerate(col_has_ink):
        if ink:
            if not in_band:
                in_band = True
                band_start = x
            gap = 0
        else:
            if in_band:
                gap += 1
                if gap > GLUE_PX:
                    bands.append([band_start, x - gap])
                    in_band = False
                    gap = 0
    if in_band:
        bands.append([band_start, w - 1])

    return [(l, r) for l, r in bands if r - l > 20]


def split_into_figures(img: Image.Image, n: int) -> list[Image.Image]:
    """Detect figure bands via transparent gaps, then tighten each bbox."""
    h = img.size[1]
    bands = find_figure_columns(img)
    if len(bands) != n:
        print(f"  ! Expected {n} figures but detected {len(bands)} bands")
    pad = 8
    figs = []
    for l, r in bands:
        sl = img.crop((max(0, l - pad), 0, min(img.size[0], r + pad), h))
        bbox = sl.getbbox()
        if bbox is None:
            figs.append(sl)
            continue
        bl, bt, br, bb = bbox
        bl = max(0, bl - pad)
        bt = max(0, bt - pad)
        br = min(sl.width, br + pad)
        bb = min(sl.height, bb + pad)
        figs.append(sl.crop((bl, bt, br, bb)))
    return figs


def main() -> None:
    for sheet_name, fig_names in SHEETS.items():
        src = RAW / sheet_name
        print(f"Loading {sheet_name} ({src.stat().st_size // 1024} KB)")
        img = Image.open(src)
        img = knockout_background(img)
        figs = split_into_figures(img, len(fig_names))
        if len(figs) != len(fig_names):
            print(f"  ! Skipping naming: detected {len(figs)}, expected {len(fig_names)}")
            continue
        for name, fig in zip(fig_names, figs):
            dst = OUT / f"{name}.png"
            fig.save(dst, optimize=True)
            print(f"  -> {dst.name}  {fig.size[0]}x{fig.size[1]}")


if __name__ == "__main__":
    main()
