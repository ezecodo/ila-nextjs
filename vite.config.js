import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// 👇 Agrega esto
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "node_modules"],
  },
});
