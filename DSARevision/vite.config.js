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
  // Multithreading & Concurrency subapp (Vite)
  // MT_TARGET env var lets Docker use the service name; falls back to localhost for local dev
  "/AlgoSprint/multithreading": {
    target: process.env.MT_TARGET || "http://localhost:4003",
    changeOrigin: true,
    ws: true,
    rewrite: (path) => path.replace(/^\/AlgoSprint\/multithreading/, "/AlgoSprint/multithreading"),
  },
};

export default defineConfig({
  base: process.env.VITE_BASE_URL || "/AlgoSprint/",
  server: {
    proxy: proxyConfig,
  },
  // preview.proxy mirrors server.proxy so `vite preview` (production) works the same way
  preview: {
    allowedHosts: true,
    proxy: proxyConfig,
  },
});
