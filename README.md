# 🎮 משחקי דור - Dor's Amazing Games

A web-based educational game platform designed specifically for **Dor (דור)**, a 3-year-old, featuring Hebrew localization, accessibility-first design, and positive reinforcement learning.

## 🌟 Features

- **Hebrew-First Interface**: All text, audio, and instructions in Hebrew (RTL support)
- **Touch & Keyboard Accessible**: No mouse required! Works with touch, spacebar, and arrow keys
- **Responsive Design**: Scales perfectly from iPhone to 4K TV
- **Positive Reinforcement**: Encouraging Hebrew audio feedback
- **Personalized**: Uses Dor's photos as rewards

## 🎨 Theme

**Visual Identity**: "Spidey and his Amazing Friends" meets "Nature Exploration"

**Color Palette**:
- Spidey Red: `#E62429`
- Spidey Blue: `#2B3B96`
- Nature Green: `#4CAF50`

**Icons**: 🦖 Dinosaurs, 🍦 Ice Cream, 🍫 Chocolate, 🕷️ Spidey

## 🎯 Games

### 1. 🦖 Dino-Counting (Available Now)
Teaches counting 1-5 by feeding ice creams to a hungry dinosaur.
- **Goal**: Count and tap the correct number of ice creams
- **Skills**: Number recognition, counting, fine motor skills
- **Interaction**: Tap screen or press Spacebar

### 2. 🕷️ Spidey's Hebrew Letters (Coming Soon)
Learn the Aleph-Bet by popping letter bubbles.
- **Goal**: Letter recognition and pronunciation
- **Skills**: Hebrew alphabet, phonics

### 3. 🏃 Dor's Park Run (Coming Soon)
A side-scrolling runner game with Dor as the hero.
- **Goal**: Jump over obstacles, collect chocolates
- **Skills**: Reaction time, coordination

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
dor-games/
├── public/
│   └── assets/
│       ├── dor_photos/      # Add Dor's photos here
│       ├── audio/           # Hebrew audio files
│       └── icons/           # Game icons
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── HomeButton.jsx
│   │   └── MainMenu.jsx
│   ├── games/               # Individual game components
│   │   └── DinoCountingGame.jsx
│   ├── hooks/               # Custom React hooks
│   │   └── useSoundManager.js
│   ├── App.jsx              # Main application
│   └── index.css            # Global styles
└── README.md
```

## 🔊 Audio Assets Required

Place the following Hebrew MP3 files in `public/assets/audio/`:

1. **kol_hakavod.mp3** - "כל הכבוד!" (Great job!)
2. **hatzlachta.mp3** - "הצלחת!" (You succeeded!)
3. **tamshich_lenasot.mp3** - "תמשיך לנסות! אתה יכול!" (Keep trying! You can do it!)
4. **background_music.mp3** - Soft instrumental acoustic guitar

## 🖼️ Adding Dor's Photos

1. Place JPG/PNG images in `public/assets/dor_photos/`
2. The game automatically discovers and displays them as rewards
3. No code changes needed!

## 🎮 Controls

### Touch Devices
- **Tap** any game button or interactive element
- Large touch targets (min 100px) for easy tapping

### Keyboard
- **Spacebar**: Select/Tap/Jump
- **Enter**: Start/Confirm
- **Arrow Keys**: Movement (in runner game)
- **Home Button**: Always visible in top-right corner

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Effects**: react-confetti
- **Audio**: HTML5 Audio API with custom hook
- **Font**: Google Fonts (Rubik for Hebrew)

## ♿ Accessibility Features

- Large interactive elements (min 100px)
- High contrast colors
- Visual feedback for all actions
- No text reading required (icon-based navigation)
- Keyboard navigation support
- Touch-friendly for small hands

## 🔒 Safety

- No external links accessible to the child
- No advertisements
- No settings menu for the child to accidentally modify
- Offline-capable (after initial load)

## 📱 Responsive Breakpoints

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px - 1919px
- **4K TV**: 1920px+

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to modify the color scheme:

```js
colors: {
  'spidey-red': '#E62429',
  'spidey-blue': '#2B3B96',
  'nature-green': '#4CAF50',
}
```

### Audio Feedback
Modify sound triggers in `src/hooks/useSoundManager.js`

## 🤝 Contributing

This is a personal project for Dor, but suggestions are welcome!

## 📄 License

Private - For personal use only

## 💖 Made with Love

Built with ❤️ for Dor (דור) by his loving family.

---

**יופי של דור! 🌟**
