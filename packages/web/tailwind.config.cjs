module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["\"Space Grotesk\"", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "\"IBM Plex Mono\"",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "\"Liberation Mono\"",
          "\"Courier New\"",
          "monospace",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
