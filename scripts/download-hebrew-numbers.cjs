const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Generate Hebrew number audio files (1-20) using Google Translate TTS
 * For the Count With Me game
 */

const audioDir = path.join(__dirname, '..', 'public', 'assets', 'audio', 'numbers');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Hebrew numbers 1-20 (counting form)
const numbers = [
  { n: 1, text: 'אחד', file: '1.mp3' },
  { n: 2, text: 'שתיים', file: '2.mp3' },
  { n: 3, text: 'שלוש', file: '3.mp3' },
  { n: 4, text: 'ארבע', file: '4.mp3' },
  { n: 5, text: 'חמש', file: '5.mp3' },
  { n: 6, text: 'שש', file: '6.mp3' },
  { n: 7, text: 'שבע', file: '7.mp3' },
  { n: 8, text: 'שמונה', file: '8.mp3' },
  { n: 9, text: 'תשע', file: '9.mp3' },
  { n: 10, text: 'עשר', file: '10.mp3' },
  { n: 11, text: 'אחת עשרה', file: '11.mp3' },
  { n: 12, text: 'שתים עשרה', file: '12.mp3' },
  { n: 13, text: 'שלוש עשרה', file: '13.mp3' },
  { n: 14, text: 'ארבע עשרה', file: '14.mp3' },
  { n: 15, text: 'חמש עשרה', file: '15.mp3' },
  { n: 16, text: 'שש עשרה', file: '16.mp3' },
  { n: 17, text: 'שבע עשרה', file: '17.mp3' },
  { n: 18, text: 'שמונה עשרה', file: '18.mp3' },
  { n: 19, text: 'תשע עשרה', file: '19.mp3' },
  { n: 20, text: 'עשרים', file: '20.mp3' },
];

function downloadAudio(item) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(item.text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=he&q=${encodedText}`;
    const filepath = path.join(audioDir, item.file);
    const file = fs.createWriteStream(filepath);

    console.log(`📥 ${item.file}: ${item.text}`);

    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
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

async function main() {
  console.log('\n🎙️ Generating Hebrew number audio (1-20) for Count With Me game\n');
  for (const item of numbers) {
    try {
      await downloadAudio(item);
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      console.error(`❌ ${item.file}:`, e.message);
    }
  }
  console.log('\n✅ Done! Files in:', audioDir);
}

main().catch(console.error);
