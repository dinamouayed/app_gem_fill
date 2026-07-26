import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: [path.resolve(__dirname, "vitest.setup.ts")],
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/data/levels/level*.ts",
        "src/data/levels/levels.generated.ts",
        "src/test/**",
        "**/*.test.{ts,tsx}",
      ],
    },
  },
  resolve: {
    alias: {
      "react-native": path.resolve(
        __dirname,
        "src/test/mocks/react-native.ts",
      ),
    },
  },
});
