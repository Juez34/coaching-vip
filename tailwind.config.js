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
          50: "#f4f7f7",
          100: "#e5ecee",
          200: "#c9d7dc",
          300: "#aabdc5",
          400: "#8aa2ac",
          500: "#6d8590",
          600: "#536b76",
          700: "#3d535e",
          800: "#293f4a",
          850: "#213641",
          900: "#182b36",
          950: "#101e29",
        },
        amber: {
          50: "#f4f7f2",
          100: "#e8efe5",
          200: "#d4e2d2",
          300: "#bdd4be",
          400: "#a6c3a9",
          500: "#8cad92",
          600: "#6f9076",
          700: "#57765f",
          800: "#3f5d48",
          900: "#2a4332",
          950: "#182b1f",
        },
      },
    },
  },
  plugins: [],
};
