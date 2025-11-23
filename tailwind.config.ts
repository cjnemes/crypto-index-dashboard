import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'crypto-green': '#00D395',
        'crypto-red': '#FF6B6B',
        'crypto-blue': '#4A90D9',
        'crypto-purple': '#9B59B6',
        'crypto-orange': '#F39C12',
      },
    },
  },
  plugins: [],
}
export default config
