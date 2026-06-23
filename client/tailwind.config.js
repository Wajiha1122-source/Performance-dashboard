export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"]
      },
      colors: {
        obsidian: "#090807",
        ink: "#14110f",
        velvet: "#211b17",
        champagne: "#f4e6cf",
        parchment: "#d8c5a5",
        brass: "#c99a4d",
        emerald: "#5dd6a5",
        rose: "#d9777f"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(201, 154, 77, 0.18)",
        glass: "0 18px 60px rgba(0, 0, 0, 0.45)"
      }
    }
  },
  plugins: []
};
