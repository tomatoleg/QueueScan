import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: true,

    allowedHosts: [
      "fedora.tail33111d.ts.net",
    ],

    proxy: {
      "/api": {
        target: "http://backend-dev:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      "/ws": {
        target: "ws://backend-dev:8080",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
