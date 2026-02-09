// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        slate: {
          950: '#020617',
        },
        enterprise: {
          bg: '#0a0a0b',
          surface: '#121214',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.15)',
        }
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 L40 40 L40 0' fill='none' stroke='white' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 1px rgba(0, 0, 0, 0.05)',
        'ent-sm': 'var(--shadow-ent-sm)',
        'ent-md': 'var(--shadow-ent-md)',
        'ent-lg': 'var(--shadow-ent-lg)',
      },
      animation: {
        'spring-in': 'spring 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        spring: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}