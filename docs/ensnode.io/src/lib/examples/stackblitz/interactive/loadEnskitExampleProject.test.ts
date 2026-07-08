import { describe, expect, it } from "vitest";

import enskitExamplePackageJson from "@workspace/examples/enskit-react-example/package.json";

import { loadEnskitExampleProject } from "./loadEnskitExampleProject";

describe("loadEnskitExampleProject", () => {
  it("loads enskit-react-example with vite preview layout and example-shaped manifest", () => {
    const project = loadEnskitExampleProject();

    expect(project.files["index.html"]).toContain('id="root"');
    expect(project.files["vite.config.ts"]).toContain("@vitejs/plugin-react");
    expect(project.files["src/App.tsx"]).toContain("EnsnodeInstanceProvider");

    expect(Object.keys(project.dependencies).sort()).toEqual(
      Object.keys(enskitExamplePackageJson.dependencies).sort(),
    );
    for (const name of Object.keys(enskitExamplePackageJson.devDependencies)) {
      expect(project.devDependencies[name]).toBeDefined();
    }

    expect(project.dependencies.enskit).toMatch(/^\d+\.\d+\.\d+/);
    expect(project.dependencies.enssdk).toMatch(/^\d+\.\d+\.\d+/);
    expect(project.runtime).toBe("node-vite");
    expect(project.view).toBe("both");
    expect(project.entryFileName).toBe("index.html");
    expect(project.openFile).toBe("src/App.tsx");
  });
});
