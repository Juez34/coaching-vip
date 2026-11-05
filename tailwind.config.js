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
          50: "#fff7f2",
          100: "#ffede3",
          200: "#fbd8c6",
          300: "#f3b494",
          400: "#e8936d",
          500: "#d77651",
          600: "#bd593d",
          700: "#984633",
          800: "#74382e",
          900: "#542b26",
          950: "#311916",
        },
      },
    },
  },
  plugins: [],
};
