#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PHOTOS_DIR = path.join(__dirname, '../public/assets/dor_photos');
const MAX_WIDTH = 1200;
const QUALITY = 80;

async function convertPhotos() {
  console.log('🖼️  Converting and renaming photos...\n');

  // Get all files
  const files = fs.readdirSync(PHOTOS_DIR);
  
  // Filter for image files (including HEIC)
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.heif'].includes(ext) && file !== 'README.md';
  });

  console.log(`Found ${imageFiles.length} photos\n`);

  let counter = 1;
  
  for (const file of imageFiles) {
    const inputPath = path.join(PHOTOS_DIR, file);
    const outputPath = path.join(PHOTOS_DIR, `dor${counter}.jpg`);
    
    // Skip if already named correctly
    if (file === `dor${counter}.jpg` || file === `dor${counter}.JPG`) {
      console.log(`✅ Keeping: ${file}`);
      counter++;
      continue;
    }

    try {
      // Get file stats
      const stats = fs.statSync(inputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      // Convert and optimize
      await sharp(inputPath)
        .resize(MAX_WIDTH, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({
          quality: QUALITY,
          progressive: true
        })
        .toFile(outputPath);

      const newStats = fs.statSync(outputPath);
      const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
      
      console.log(`✅ Converted: ${file} → dor${counter}.jpg`);
      console.log(`   ${sizeMB} MB → ${newSizeMB} MB\n`);
      
      // Delete original if conversion successful
      if (file !== `dor${counter}.jpg`) {
        fs.unlinkSync(inputPath);
      }
      
      counter++;
    } catch (error) {
      console.error(`❌ Error converting ${file}:`, error.message);
    }
  }

  console.log(`\n✅ Done! Created ${counter - 1} photos named dor1.jpg through dor${counter-1}.jpg`);
  console.log('\n🎮 Restart the game to see your photos!\n');
}

convertPhotos().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

