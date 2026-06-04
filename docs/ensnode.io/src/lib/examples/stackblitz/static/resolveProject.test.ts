import { describe, expect, it } from "vitest";

import { resolveStaticExampleStackBlitzProject } from "./resolveProject";

describe("resolveStaticExampleStackBlitzProject", () => {
  it("rebuilds an enssdk project from a known example id", () => {
    const project = resolveStaticExampleStackBlitzProject(
      "domain-by-name-type-condition",
      "enssdk",
    );

    expect(project.title).toBe("Domain By Name using enssdk");
    expect(project.description).toContain("Load a domain by interpreted name");
    expect(project.runtime).toBe("node-tsx");
    expect(project.files["src/index.ts"]).toContain("query DomainByName");
    expect(project.files["src/index.ts"]).toContain("asInterpretedName");
  });

  it("rebuilds an enskit project from a known example id", () => {
    const project = resolveStaticExampleStackBlitzProject(
      "domain-by-name-type-condition",
      "enskit",
    );

    expect(project.title).toBe("Domain By Name using enskit");
    expect(project.description).toContain("Load a domain by interpreted name");
    expect(project.runtime).toBe("node-vite");
    expect(project.files["src/App.tsx"]).toContain("useOmnigraphQuery");
    expect(project.files["index.html"]).toContain('id="root"');
  });
});
