#!/usr/bin/env node
/**
 * Resize and compress images for web.
 * Target: max width 1280px (2x for 640px display), optimized quality.
 */
import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import { join, extname } from 'path';
import { tmpdir } from 'os';

const DIR = new URL('.', import.meta.url).pathname;
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 82;
const PNG_COMPRESSION = 9;
const WEBP_QUALITY = 82;

async function compress() {
  const files = await readdir(DIR);
  const images = files.filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  );

  for (const file of images) {
    const inputPath = join(DIR, file);
    const ext = extname(file).toLowerCase();
    const base = file.replace(ext, '');
    const { size: origSize } = await stat(inputPath);

    try {
      let pipeline = sharp(inputPath);
      const meta = await pipeline.metadata();
      const width = meta.width || 0;
      const height = meta.height || 0;

      if (width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
      }

      const tempPath = join(tmpdir(), `compress-${file}`);

      if (ext === '.jpg' || ext === '.jpeg') {
        await pipeline
          .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
          .toFile(tempPath);
      } else if (ext === '.png') {
        await pipeline
          .png({ compressionLevel: PNG_COMPRESSION, effort: 10 })
          .toFile(tempPath);
      } else if (ext === '.webp') {
        await pipeline
          .webp({ quality: WEBP_QUALITY, effort: 6 })
          .toFile(tempPath);
      }

      const { size: newSize } = await stat(tempPath);
      const outPath = join(DIR, file);
      await rename(tempPath, outPath);
      const saved = ((1 - newSize / origSize) * 100).toFixed(1);
      console.log(`${file}: ${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (${saved}% smaller)`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
}

compress();
