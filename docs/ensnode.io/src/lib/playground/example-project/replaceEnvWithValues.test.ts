import { describe, expect, it } from "vitest";

import { replaceEnvWithValues } from "./replaceEnvWithValues";

const ENSNODE_URL_ASSIGNMENT = /const ENSNODE_URL = process\.env\.ENSNODE_URL!;/;

describe("replaceEnvWithValues", () => {
  it("replaces ENSNODE_URL env access with a literal", () => {
    const source = `const ENSNODE_URL = process.env.ENSNODE_URL!;\nconst x = 1;`;
    const result = replaceEnvWithValues({ files: { "src/index.ts": source } }, [
      {
        pattern: ENSNODE_URL_ASSIGNMENT,
        replacement: 'const ENSNODE_URL = "https://example.test";',
      },
    ]);

    expect(result.files["src/index.ts"]).not.toContain("process.env.ENSNODE_URL");
    expect(result.files["src/index.ts"]).toContain('const ENSNODE_URL = "https://example.test";');
    expect(result.files["src/index.ts"]).toContain("const x = 1;");
  });
});
