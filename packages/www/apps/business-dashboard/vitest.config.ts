import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
      include: [
        "app/services/**/*.{js,ts,jsx,tsx}",
        "app/utils/**/*.{js,ts,jsx,tsx}",
        "app/sessions/**/*.{js,ts,jsx,tsx}",
      ],
      exclude: [
        "**/*.{test,spec}.{js,ts,jsx,tsx}",
        "**/mocks/**",
        "**/tests/**",
        "**/*loaders.server*",
        "**/*actions.server*",
      ],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
    },
  },
});
