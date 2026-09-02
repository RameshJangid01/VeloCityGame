/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: false, // avoid clobbering antd's own base styles
  },
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00E0C6',
          deep: '#00A895',
          magenta: '#FF3D8A',
          gold: '#FFB800',
        },
        dusk: {
          bg: '#0A0E17',
          bgAlt: '#111726',
          panel: '#161D2E',
          border: '#232B41',
        }
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        dust: {
          '0%': { transform: 'translateX(0) scale(1)', opacity: 0.6 },
          '100%': { transform: 'translateX(-40px) scale(0.4)', opacity: 0 },
        }
      },
      animation: {
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
        dust: 'dust 0.6s linear infinite',
      }
    },
  },
  plugins: [],
}
