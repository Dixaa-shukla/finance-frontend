/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F1B3D',
          800: '#16224D',
          700: '#1E2B5E',
        },
        sky: {
          50: '#F3F8FF',
          100: '#E8F1FE',
          200: '#D6E7FC',
        },
        lavender: {
          100: '#EDEBFB',
          200: '#DCD8F7',
        },
        // The soft mint the reference design tints its "Savings" card with.
        mint: {
          50: '#F0FBF6',
          100: '#DCF5EB',
          200: '#C3EEDD',
        },
        brand: {
          blue: '#3B6FE0',
          purple: '#7B6EF6',
          cyan: '#3FC7E0',
          green: '#22B07D',
          // The lighter blue the reference design's buttons fade INTO
          // (purple on the left → this on the right). Added for the auth
          // screens; brand-blue alone renders noticeably darker than the design.
          sky: '#5AA9F0',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
        pill: '999px',
      },
      boxShadow: {
        /**
         * Two layers, both blue-tinted: a tight one that reads as the card's
         * edge and a wide diffuse one that lifts it off the gradient. A single
         * large shadow looks grey and muddy against a coloured background.
         */
        glass:
          '0 1px 2px 0 rgba(15, 27, 61, 0.03), 0 12px 32px -8px rgba(59, 111, 224, 0.14)',
        soft: '0 1px 2px 0 rgba(15, 27, 61, 0.03), 0 6px 18px -6px rgba(59, 111, 224, 0.16)',
        /** Hover state for cards that are also links. */
        lift: '0 2px 4px 0 rgba(15, 27, 61, 0.04), 0 20px 44px -12px rgba(59, 111, 224, 0.24)',
        /** Coloured glow under the active sidebar pill and primary buttons. */
        glow: '0 8px 22px -6px rgba(90, 110, 240, 0.5)',
      },
      backgroundImage: {
        'app-gradient':
          'linear-gradient(160deg, #F5F8FF 0%, #EEF0FD 42%, #EAF7FC 72%, #F3F1FD 100%)',
        'card-sheen':
          'linear-gradient(140deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.62) 60%, rgba(247,250,255,0.72) 100%)',
      },
    },
  },
  plugins: [],
};
