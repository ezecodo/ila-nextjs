import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { transformSync } from "esbuild";

// Vitest usa Vite que por defecto no trata .js como JSX.
// Este plugin pre-transforma los archivos .js del proyecto con esbuild (loader jsx).
const jsAsJsxPlugin = {
  name: "js-as-jsx",
  enforce: "pre",
  transform(code, id) {
    if (id.match(/\.js$/) && !id.match(/node_modules/)) {
      const result = transformSync(code, {
        loader: "jsx",
        jsx: "automatic",
      });
      return { code: result.code };
    }
  },
};

export default defineConfig({
  plugins: [
    jsAsJsxPlugin,
    react({
      // El React plugin maneja .jsx y .tsx (los .js ya los procesó el plugin anterior)
      include: /\.(jsx|tsx)$/,
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/app/**/order/**/*.test.{js,jsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
