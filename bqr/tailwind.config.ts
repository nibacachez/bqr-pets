import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0f7',
          100: '#cce1ef',
          200: '#99c3df',
          300: '#66a5cf',
          400: '#3387bf',
          500: '#1a5fa0',
          600: '#14477f',
          700: '#0e305e',
          800: '#08183d',
          900: '#101E3A', // Azul Corporativo Profesional
          950: '#0a0f1d',
        },
        accent: {
          50: '#e0f9fb',
          100: '#c0f3f7',
          200: '#81e7ef',
          300: '#42dbe7',
          400: '#1acfe0',
          500: '#00C4CC', // Celeste/Calipso Vibrante
          600: '#00a3a9',
          700: '#008286',
          800: '#006063',
          900: '#003f41',
          950: '#001d1e',
        },
        grayscale: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      backgroundColor: {
        'default': '#101E3A',
      },
      textColor: {
        'default': '#ffffff',
      },
    },
  },
  plugins: [],
};

export default config;
