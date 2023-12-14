// @ts-check

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    restoreMocks: true,
  },
  plugins: [react()],
  build: {
    // for github pages deployment compatibility
    outDir: "_site",
  },
});
