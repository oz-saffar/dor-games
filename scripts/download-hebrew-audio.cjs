const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Generate Hebrew audio files using Google Translate's unofficial TTS API
 * This is a simple solution that works without API keys
 */

const audioDir = path.join(__dirname, '..', 'public', 'assets', 'audio');

// Ensure directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const phrases = [
  {
    filename: 'kol_hakavod.mp3',
    text: 'כל הכבוד',
    description: 'Well done!'
  },
  {
    filename: 'hatzlachta.mp3',
    text: 'הצלחת',
    description: 'You succeeded!'
  },
  {
    filename: 'tamshich_lenasot.mp3',
    text: 'תמשיך לנסות! אתה יכול!',
    description: 'Keep trying! You can do it!'
  }
];

function downloadAudio(phrase) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(phrase.text);
    // Using Google Translate TTS (unofficial API)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=he&q=${encodedText}`;
    
    const filepath = path.join(audioDir, phrase.filename);
    const file = fs.createWriteStream(filepath);
    
    console.log(`📥 Downloading: ${phrase.filename}`);
    console.log(`   Text: ${phrase.text} (${phrase.description})`);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Saved: ${filepath}\n`);
          resolve();
        });
      } else {
        fs.unlink(filepath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateAllAudio() {
  console.log('\n🎙️ Generating Hebrew Audio Files for Dor\'s Games\n');
  console.log('='.repeat(60));
  console.log(`Output directory: ${audioDir}\n`);
  
  for (const phrase of phrases) {
    try {
      await downloadAudio(phrase);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error downloading ${phrase.filename}:`, error.message);
    }
  }
  
  console.log('='.repeat(60));
  console.log('\n✨ Audio generation complete!\n');
  console.log('📝 Next steps:');
  console.log('1. Check the files in: ' + audioDir);
  console.log('2. For background_music.mp3, download from:');
  console.log('   • YouTube Audio Library: https://www.youtube.com/audiolibrary');
  console.log('   • Bensound: https://www.bensound.com/');
  console.log('3. Refresh your browser at http://localhost:5173/');
  console.log('4. Play a game to test the audio!\n');
}

// Run if called directly
if (require.main === module) {
  generateAllAudio().catch(console.error);
}

module.exports = { generateAllAudio };
