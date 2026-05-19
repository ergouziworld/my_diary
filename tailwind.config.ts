import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        panel: "#11172a",
        muted: "#7f8aa3",
        line: "#22304d",
        accent: "#7dd3fc"
      }
    }
  },
  plugins: []
};

export default config;
