#!/usr/bin/env python3
"""Split a 3-character wide image into thirds, remove BG per panel (flood-fill)."""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REMOVE_BG = ROOT / "scripts" / "remove_runner_bg.py"
OUT_DIR = ROOT / "public" / "assets" / "runner-dash"


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not src or not src.is_file():
        print("Usage: split_spidey_team.py <input.png>", file=sys.stderr)
        sys.exit(1)

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    third = w // 3
    # Slight inset so we don't grab neighbor character at seams (~1.5% each side)
    inset = max(2, int(w * 0.015))
    slices = [
        (0, third + inset, "ghost-spider"),
        (third - inset, 2 * third + 2 * inset, "spidey"),
        (2 * third - 2 * inset, w, "spin"),
    ]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for x0, x1, name in slices:
        x0 = max(0, min(x0, w - 1))
        x1 = max(x0 + 1, min(x1, w))
        crop = img.crop((x0, 0, x1, h))
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tpath = Path(tmp.name)
        try:
            crop.save(tpath, optimize=True)
            out = OUT_DIR / f"{name}.png"
            # Gradient hero BG — moderate tolerance
            tol = 58 if name == "spidey" else 52
            subprocess.run(
                [sys.executable, str(REMOVE_BG), str(tpath), str(out), "--tol", str(tol), "--trim"],
                check=True,
                capture_output=True,
                text=True,
            )
            print(f"Wrote {out}")
        finally:
            tpath.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
