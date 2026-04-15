import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || "/AlgoSprint/multithreading/",
  server: {
    port: 3003,
    host: true,
  },
  preview: {
    port: 4003,
    host: true,
    allowedHosts: true,
  },
});
