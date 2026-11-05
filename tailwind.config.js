/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f8f5fa",
          100: "#ece7f0",
          200: "#d7cfdf",
          300: "#beb3ca",
          400: "#a397b2",
          500: "#857991",
          600: "#695e75",
          700: "#50475c",
          800: "#393242",
          850: "#302a39",
          900: "#241f2d",
          950: "#19151f",
        },
        amber: {
          50: "#fbf6fc",
          100: "#f3e9f6",
          200: "#e7d5ee",
          300: "#d8bde5",
          400: "#c79dde",
          500: "#b578d0",
          600: "#995bb4",
          700: "#7b4694",
          800: "#5d356f",
          900: "#41264f",
          950: "#291831",
        },
      },
    },
  },
  plugins: [],
};
