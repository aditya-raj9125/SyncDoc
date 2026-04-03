import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#6366f1',
          'primary-hover': '#4f46e5',
          secondary: '#10b981',
        },
        surface: {
          canvas: '#FAFAF9',
          DEFAULT: '#FFFFFF',
          elevated: '#F5F5F4',
          border: '#E7E5E4',
        },
        dark: {
          canvas: '#111110',
          surface: '#1C1917',
          elevated: '#292524',
          border: '#3C3837',
        },
        text: {
          primary: '#1C1917',
          secondary: '#78716C',
          tertiary: '#A8A29E',
          placeholder: '#D6D3D1',
        },
        success: '#10b981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#6366f1',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 12px 32px rgba(0,0,0,0.12)',
        floating: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.1' }],
        h1: ['36px', { lineHeight: '1.2' }],
        h2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['17px', { lineHeight: '1.75', letterSpacing: '-0.01em' }],
        sm: ['14px', { lineHeight: '1.5' }],
        xs: ['12px', { lineHeight: '1.4' }],
        label: ['12px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.04em' }],
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
        'slide-out-left': 'slide-out-left 0.15s ease-in',
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
