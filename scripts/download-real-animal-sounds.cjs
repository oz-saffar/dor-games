/**
 * Downloads REAL animal sounds from GitHub repositories.
 * Sources:
 *   Misiker101/Animal-sound-game  → cat, cow, dog, horse, lion, rooster, wolf, tiger
 *   IkunoZ/EsmaeSounds            → dog, elephant, gorilla, lion, monkey, tiger, alligator, rhino, coyote
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const OUT = path.join(__dirname, '../public/assets/audio/animals');
fs.mkdirSync(OUT, { recursive: true });

// Each animal: output filename, and ordered list of raw GitHub URLs to try
const ANIMALS = [
  {
    out: 'dog.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/dog.wav',
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/dog.mp3',
    ],
  },
  {
    out: 'cat.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/cat.wav',
    ],
  },
  {
    out: 'cow.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/cow.wav',
    ],
  },
  {
    out: 'horse.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/horse.wav',
    ],
  },
  {
    out: 'lion.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/lion.wav',
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/lion.mp3',
    ],
  },
  {
    out: 'rooster.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/rooster.wav',
    ],
  },
  {
    out: 'wolf.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/wolf.wav',
    ],
  },
  {
    out: 'tiger.wav',
    urls: [
      'https://raw.githubusercontent.com/Misiker101/Animal-sound-game/master/src/animalSound/tiger.wav',
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/tiger.mp3',
    ],
  },
  {
    out: 'elephant.mp3',
    urls: [
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/elephant.mp3',
      'https://raw.githubusercontent.com/jshsam/ZooApp/master/app/src/main/res/raw/elephant.mp3',
    ],
  },
  {
    out: 'monkey.mp3',
    urls: [
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/monkey.mp3',
    ],
  },
  {
    out: 'gorilla.mp3',
    urls: [
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/gorilla.mp3',
    ],
  },
  {
    out: 'alligator.mp3',
    urls: [
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/alligator.mp3',
    ],
  },
  {
    out: 'rhino.mp3',
    urls: [
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/rhino.mp3',
    ],
  },
  {
    out: 'fox.mp3',
    urls: [
      'https://raw.githubusercontent.com/IkunoZ/EsmaeSounds/master/sound-files/coyote.mp3',
    ],
  },
];

const fetchBuf = (url) =>
  new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBuf(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });

(async () => {
  console.log('Downloading real animal sounds from GitHub…\n');
  let ok = 0;
  for (const animal of ANIMALS) {
    const dest = path.join(OUT, animal.out);
    let downloaded = false;
    for (const url of animal.urls) {
      try {
        const buf = await fetchBuf(url);
        if (buf.length > 3000) {
          fs.writeFileSync(dest, buf);
          console.log(`✅  ${animal.out}  (${(buf.length / 1024).toFixed(1)} KB)  ${url.replace('https://raw.githubusercontent.com/', '')}`);
          downloaded = true;
          ok++;
          break;
        }
      } catch (e) {
        // try next URL
      }
    }
    if (!downloaded) console.error(`❌  ${animal.out}  — all URLs failed`);
  }
  console.log(`\n${ok}/${ANIMALS.length} real sounds downloaded.`);
})();
