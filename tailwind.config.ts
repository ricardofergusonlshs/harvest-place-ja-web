import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        farm: {
          background: '#F4F9F2',
          card: '#FFFFFF',
          cardSoft: '#FFFEFC',
          primary: '#2D6741',
          primaryDark: '#183B28',
          primarySoft: '#EAF5E7',
          olive: '#5F7651',
          accent: '#DFA75A',
          accentSoft: '#FFF3D9',
          text: '#1E2A21',
          muted: '#5F6A62',
          border: '#D8E5D4',
          success: '#4F8A5B',
          warning: '#966012',
          danger: '#B44A3A'
        }
      },
      boxShadow: {
        elite: '0 22px 70px rgba(24, 59, 40, 0.13)',
        card: '0 14px 40px rgba(24, 59, 40, 0.09)'
      },
      borderRadius: {
        elite: '2rem'
      }
    }
  },
  plugins: []
};

export default config;
