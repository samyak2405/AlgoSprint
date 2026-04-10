import { defineConfig } from "vite";

export default defineConfig({
  base: "/AlgoSprint/",
  server: {
    proxy: {
      // Proxy the System Design Simulator (Next.js) behind the same domain path.
      // Expected: run Next dev server on http://localhost:3001
      "/AlgoSprint/system-design-simulator": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/AlgoSprint\/system-design-simulator/, ""),
      },
      // Next.js serves assets from /_next/*
      "/_next": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});

