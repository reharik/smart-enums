import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: packageDir,
  test: {
    include: ["test/**/*.test.ts"],
  },
});
