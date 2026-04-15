import { defineConfig } from "vite";

const proxyConfig = {
  // Proxy the System Design Simulator (Next.js)
  // SD_TARGET env var lets Docker use the service name; falls back to localhost for local dev
  "/AlgoSprint/system-design-simulator": {
    target: process.env.SD_TARGET || "http://localhost:3000",
    changeOrigin: true,
    ws: true,
    rewrite: (path) => path.replace(/^\/AlgoSprint\/system-design-simulator/, ""),
  },
  // Next.js serves assets from /_next/*
  "/_next": {
    target: process.env.SD_TARGET || "http://localhost:3000",
    changeOrigin: true,
    ws: true,
  },
  // LLD Design subapp (Vite)
  // LLD_TARGET env var lets Docker use the service name; falls back to localhost for local dev
  "/AlgoSprint/lld": {
    target: process.env.LLD_TARGET || "http://localhost:3002",
    changeOrigin: true,
    ws: true,
    rewrite: (path) => path.replace(/^\/AlgoSprint\/lld/, "/AlgoSprint/lld"),
  },
};

export default defineConfig({
  base: "/AlgoSprint/",
  server: {
    proxy: proxyConfig,
  },
  // preview.proxy mirrors server.proxy so `vite preview` (production) works the same way
  preview: {
    allowedHosts: true,
    proxy: proxyConfig,
  },
});
