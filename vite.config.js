// @ts-check

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    restoreMocks: true,
    // https://vitest.dev/config/#exclude
    exclude: [
      // default
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      // ignore end-to-end tests
      "test/*.spec.js",
    ],
  },
  plugins: [react()],
  build: {
    // for github pages deployment compatibility
    outDir: "_site",
  },
});
