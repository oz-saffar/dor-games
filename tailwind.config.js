/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dor: {
          parchment: 'var(--dor-parchment)',
          mist: 'var(--dor-mist)',
          ink: 'var(--dor-ink)',
          'ink-muted': 'var(--dor-ink-muted)',
          'ink-subtle': 'var(--dor-ink-subtle)',
          ember: 'var(--dor-ember)',
          'ember-dark': 'var(--dor-ember-dark)',
          teal: 'var(--dor-teal)',
          panel: 'var(--dor-panel)',
          'panel-elevated': 'var(--dor-panel-elevated)',
          glass: 'var(--dor-glass)',
          border: 'var(--dor-border)',
          'border-strong': 'var(--dor-border-strong)',
          focus: 'var(--dor-focus)',
          gold: 'var(--dor-gold)',
          'gold-bright': 'var(--dor-gold-bright)',
          /* Nature accent scale */
          sage: 'var(--dor-sage)',
          terracotta: 'var(--dor-terracotta)',
          ochre: 'var(--dor-ochre)',
          sky: 'var(--dor-sky)',
          clay: 'var(--dor-clay)',
          moss: 'var(--dor-moss)',
          plum: 'var(--dor-plum)',
          sand: 'var(--dor-sand)',
        },
        game: {
          accent: 'var(--game-accent)',
          card: 'var(--game-card)',
          'card-strong': 'var(--game-card-strong)',
          edge: 'var(--game-edge)',
        },
        spidey: {
          red: 'var(--dor-ember)',
          blue: 'var(--dor-teal)',
        },
      },
      fontFamily: {
        display: ['Varela Round', 'Rubik', 'Arial', 'sans-serif'],
        sans: ['Rubik', 'Arial', 'sans-serif'],
        hebrew: ['Rubik', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'dor-sm': 'var(--dor-radius-sm)',
        'dor-md': 'var(--dor-radius-md)',
        'dor-lg': 'var(--dor-radius-lg)',
        'dor-xl': 'var(--dor-radius-xl)',
      },
      boxShadow: {
        'dor-card': 'var(--dor-shadow-card)',
        'dor-card-hover': 'var(--dor-shadow-card-hover)',
        'dor-sm': 'var(--dor-shadow-sm)',
        'dor-lip': '0 3px 0 var(--dor-lip), var(--dor-shadow-card)',
        'dor-lip-sm': '0 2px 0 var(--dor-lip), var(--dor-shadow-sm)',
      },
      zIndex: {
        chrome: '100',
        overlay: '200',
        modal: '300',
        'game-chrome': '10000',
      },
    },
  },
  plugins: [],
};
