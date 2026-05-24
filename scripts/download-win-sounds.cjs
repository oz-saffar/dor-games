const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Generate Hebrew win celebration audio files using Google Translate TTS
 */

const audioDir = path.join(__dirname, '..', 'public', 'assets', 'audio');
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const winPhrases = [
  { filename: 'yish.mp3', text: 'יש' },
  { filename: 'dor_haaluf.mp3', text: 'דור האלוף' },
  { filename: 'dor_hatoch.mp3', text: 'דור התותח' },
  { filename: 'dor_kol_hakavod.mp3', text: 'דור כל הכבוד' },
];

function downloadAudio(item) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=he&q=${encodeURIComponent(item.text)}`;
    const filepath = path.join(audioDir, item.filename);
    const file = fs.createWriteStream(filepath);
    console.log(`📥 ${item.filename}: ${item.text}`);
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        fs.unlink(filepath, () => {});
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('\n🎙️ Downloading win sounds...\n');
  for (const item of winPhrases) {
    try {
      await downloadAudio(item);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.error(`❌ ${item.filename}:`, e.message);
    }
  }
  console.log('\n✅ Done!\n');
}

main().catch(console.error);
