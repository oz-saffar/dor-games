#!/usr/bin/env python3
"""
Remove background by flood-filling from image corners (RGB distance tolerance).
Works when the backdrop meets edges; tweak --tol per asset if needed.
"""
from __future__ import annotations

import argparse
from collections import deque

import numpy as np
from PIL import Image


def rgba_from_path(path: str) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"))


def save_rgba(arr: np.ndarray, path: str) -> None:
    Image.fromarray(arr, mode="RGBA").save(path, optimize=True)


def color_dist(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Per-pixel Euclidean distance in RGB."""
    d = a[..., :3].astype(np.int16) - b.astype(np.int16)
    return np.sqrt((d * d).sum(axis=-1))


def flood_transparent(
    rgba: np.ndarray,
    tol: float,
    corner_frac: float = 0.02,
) -> np.ndarray:
    h, w = rgba.shape[:2]
    out = rgba.copy()

    # Sample reference colors from corners (small patches — handles JPEG noise)
    cw = max(1, int(w * corner_frac))
    ch = max(1, int(h * corner_frac))
    patches = [
        rgba[:ch, :cw, :3].reshape(-1, 3),
        rgba[:ch, -cw:, :3].reshape(-1, 3),
        rgba[-ch:, :cw, :3].reshape(-1, 3),
        rgba[-ch:, -cw:, :3].reshape(-1, 3),
    ]
    ref = np.vstack(patches).astype(np.float32)

    def min_dist_to_ref(rgb: np.ndarray) -> float:
        # rgb (3,) vs ref (N,3)
        d = rgb.astype(np.float32) - ref
        return float(np.sqrt((d * d).sum(axis=1)).min())

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or visited[y, x]:
            return
        visited[y, x] = True
        if min_dist_to_ref(out[y, x, :3]) <= tol:
            q.append((x, y))

    # Seed entire border
    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        out[y, x, 3] = 0
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            if visited[ny, nx]:
                continue
            visited[ny, nx] = True
            if min_dist_to_ref(out[ny, nx, :3]) <= tol:
                q.append((nx, ny))

    return out


def trim_transparent(rgba: np.ndarray, pad: int = 2) -> np.ndarray:
    a = rgba[:, :, 3]
    rows = np.any(a > 8, axis=1)
    cols = np.any(a > 8, axis=0)
    if not rows.any() or not cols.any():
        return rgba
    y0, y1 = np.where(rows)[0][[0, -1]]
    x0, x1 = np.where(cols)[0][[0, -1]]
    y0 = max(0, y0 - pad)
    y1 = min(rgba.shape[0] - 1, y1 + pad)
    x0 = max(0, x0 - pad)
    x1 = min(rgba.shape[1] - 1, x1 + pad)
    return rgba[y0 : y1 + 1, x0 : x1 + 1]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--tol", type=float, default=42.0, help="RGB distance tolerance (0–441)")
    p.add_argument("--trim", action="store_true")
    args = p.parse_args()

    rgba = rgba_from_path(args.input)
    out = flood_transparent(rgba, tol=args.tol)
    if args.trim:
        out = trim_transparent(out)
    save_rgba(out, args.output)
    print(f"Wrote {args.output} ({out.shape[1]}x{out.shape[0]})")


if __name__ == "__main__":
    main()
