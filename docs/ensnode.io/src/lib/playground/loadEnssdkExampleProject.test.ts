import { describe, expect, it } from "vitest";

import enssdkExamplePackageJson from "@workspace/examples/enssdk-example/package.json";

import { loadEnssdkExampleProject } from "./loadEnssdkExampleProject";

describe("loadEnssdkExampleProject", () => {
  it("loads enssdk-example source with env substituted and example-shaped package manifest", () => {
    const project = loadEnssdkExampleProject();
    const indexSource = project.files["src/index.ts"];

    expect(indexSource).toBeDefined();
    expect(indexSource).toContain("HelloWorldQuery");
    expect(indexSource).not.toContain("process.env.ENSNODE_URL");

    expect(Object.keys(project.dependencies).sort()).toEqual(
      Object.keys(enssdkExamplePackageJson.dependencies).sort(),
    );
    for (const name of Object.keys(enssdkExamplePackageJson.devDependencies)) {
      expect(project.devDependencies[name]).toBeDefined();
    }

    expect(project.dependencies.enssdk).toMatch(/^\d+\.\d+\.\d+/);
    expect(project.devDependencies["@types/node"]).toBe("24.10.9");
    expect(project.devDependencies["gql.tada"]).toBe("^1.8.10");
    expect(project.devDependencies.tsx).toBe("^4.7.1");
    expect(project.devDependencies.graphql).toBeDefined();
    expect(project.devDependencies.viem).toBeDefined();

    expect(project.entryFileName).toBe("src/index.ts");
    expect(project.runtime).toBe("node-tsx");
  });
});
