/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#d4a373",
        background: "#fcfcfc",
        "header-bg": "#fff",
        "text-main": "#2c2c2c",
        "text-muted": "#787878",
        border: "#f2f2f2",
        "accent-pink": "#fff0f3",
      },
    },
  },
  plugins: [],
}
