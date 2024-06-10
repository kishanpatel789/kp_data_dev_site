/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./theme/templates/**/*.html", "./content/pages/*.html", "./content/posts/*.md"],
  theme: {
    extend: {
      colors: {
        kpddmain: "#293c47",
        kpddsec: "#3f5765",
        kpddaccent: "#c2ae45"
      }
    },
  },
  plugins: [],
}

