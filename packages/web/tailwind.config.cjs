module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}", "./node_modules/layerchart/**/*.{svelte,js}"],
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
  plugins: [],
};
