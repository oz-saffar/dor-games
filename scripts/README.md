# Scripts

## optimize-images.js

Optimizes images in `public/assets/dor_photos/` for web use.

### Installation

```bash
npm install --save-dev sharp
```

### Usage

```bash
node scripts/optimize-images.js
```

### What it does:

1. **Finds all images** in `public/assets/dor_photos/`
2. **Converts** to JPEG format
3. **Resizes** to max 1200px width (maintains aspect ratio)
4. **Compresses** to 80% quality
5. **Saves** to `public/assets/dor_photos_optimized/`

### Supported input formats:

- JPG, JPEG, PNG, GIF, BMP, TIFF, WebP, HEIC, HEIF

### After running:

1. Check the optimized images in `public/assets/dor_photos_optimized/`
2. If happy with them, move them back to `public/assets/dor_photos/`
3. Optionally delete the originals

### Example:

```bash
# Before
public/assets/dor_photos/IMG_1234.HEIC (4.5 MB)

# After
public/assets/dor_photos_optimized/IMG_1234.jpg (245 KB)
# 95% smaller!
```

## Alternative: Online Tools

If you prefer not to install packages, use online tools:

- [TinyPNG](https://tinypng.com/) - Compress PNG/JPEG
- [Squoosh](https://squoosh.app/) - Advanced image optimization
- [CloudConvert](https://cloudconvert.com/) - Convert HEIC to JPG

Just drag and drop your images, download the optimized versions, and place them in `public/assets/dor_photos/` with simple names like `dor1.jpg`, `dor2.jpg`, etc.










