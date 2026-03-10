/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: ["bg-red-500", "h-10", "w-full"],
  theme: {
    extend: {},
  },
  plugins: [],
};