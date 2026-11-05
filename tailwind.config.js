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
          50: "#f7f6f4",
          100: "#ebe8e4",
          200: "#d5d0ca",
          300: "#b8b1a8",
          400: "#968d84",
          500: "#776e66",
          600: "#5f564f",
          700: "#49423d",
          800: "#34302d",
          850: "#2b2826",
          900: "#211f1e",
          950: "#171615",
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
