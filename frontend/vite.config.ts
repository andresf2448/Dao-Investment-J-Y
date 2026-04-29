import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@dao/contracts-sdk"],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@dao/contracts-sdk": path.resolve(__dirname, "../contracts-sdk/src/index.ts"),
    },
  },
});
