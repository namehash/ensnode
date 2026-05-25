import { describe, expect, it } from "vitest";

import { buildStackBlitzPackageJson, buildStackBlitzProjectPayload } from "../sdk/buildPayload";
import { buildStaticExampleStackBlitzProject } from "./buildProject";

describe("buildStaticExampleStackBlitzProject", () => {
  it("builds an enssdk node project with the snippet as src/index.ts", () => {
    const project = buildStaticExampleStackBlitzProject("enssdk", {
      title: "domains-by-address-enssdk",
      snippet: 'console.log("hello")',
    });

    expect(project.runtime).toBe("node-tsx");
    expect(project.entryFileName).toBe("src/index.ts");
    expect(project.files["src/index.ts"]).toBe('console.log("hello")');
    expect(project.files[".env"]).toMatch(/^ENSNODE_URL=/);
    expect(Object.keys(project.dependencies)).toContain("enssdk");
  });

  it("builds an enskit vite project with scaffold files and App snippet", () => {
    const project = buildStaticExampleStackBlitzProject("enskit", {
      title: "domains-by-address-enskit",
      snippet: "export default function App() { return null; }",
    });

    expect(project.runtime).toBe("node-vite");
    expect(project.openFile).toBe("src/App.tsx");
    expect(project.files["src/App.tsx"]).toContain("export default function App");
    expect(project.files["index.html"]).toContain('id="root"');
    expect(project.files["vite.config.ts"]).toContain("@vitejs/plugin-react");
    expect(project.files[".env"]).toMatch(/^VITE_ENSNODE_URL=/);
    expect(Object.keys(project.dependencies)).toContain("enskit");
  });
});

describe("buildStackBlitzProjectPayload", () => {
  it("includes package.json with npm scripts", () => {
    const project = buildStaticExampleStackBlitzProject("enssdk", {
      title: "Example",
      snippet: "export {}",
    });
    const payload = buildStackBlitzProjectPayload(project);
    const packageJson = JSON.parse(payload.files["package.json"]);

    expect(payload.template).toBe("node");
    expect(packageJson.scripts.start).toBe("tsx src/index.ts");
    expect(packageJson.dependencies.enssdk).toBeTruthy();
  });
});
