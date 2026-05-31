import { describe, expect, it } from "vitest";

import exampleSnapshots from "@data/omnigraph-examples/examples.json";
import snapshot from "@data/omnigraph-examples/snapshot.json";
import type { SnapshotExample } from "@data/omnigraph-examples/types";

import {
  buildEnskitSetupSnippets,
  buildEnskitSnippet,
  buildEnssdkSetupSnippets,
  buildEnssdkSnippet,
  extractGraphQLOperationName,
  formatVariablesForTypeScript,
  parseGraphQLVariableTypes,
  SETUP_PACKAGE_MANAGERS,
} from "./build-integration-snippets";
import { expectIntegrationSnippetTypechecks } from "./typecheck-integration-snippet";

const activeSnapshotExamples = exampleSnapshots as SnapshotExample[];

// Minimal real-ish query fixtures
const domainByNameQuery = `query DomainByName($name: InterpretedName!) {
  domain(by: {name: $name}) {
    name
    owner { address }
  }
}`;

const domainsByAddressQuery = `query AccountDomains(
  $address: Address!
) {
  account(by: { address: $address }) {
    domains { edges { node { name } } }
  }
}`;

const registryDomainsQuery = `query RegistryDomains(
  $registry: AccountIdInput!
) {
  registry(by: { contract: $registry }) {
    domains { edges { node { name } } }
  }
}`;

const namegraphQuery = `query Namegraph {
  domains { edges { node { name } } }
}`;

const queryWithComments = `# query NotHelloWorld { this is not a query but a comment haha }
query HelloWorld { domain { name } }`;

describe("extractGraphQLOperationName", () => {
  it("extracts the operation name from a standard query", () => {
    expect(extractGraphQLOperationName(domainByNameQuery)).toBe("DomainByName");
  });

  it("extracts operation name from a multi-line query", () => {
    expect(extractGraphQLOperationName(registryDomainsQuery)).toBe("RegistryDomains");
  });

  it("returns 'Query' when no operation name is found", () => {
    expect(extractGraphQLOperationName("{ domain { name } }")).toBe("Query");
  });

  it("handles queries without variables", () => {
    expect(extractGraphQLOperationName(namegraphQuery)).toBe("Namegraph");
  });

  it("ignores operation-like text in # line comments", () => {
    expect(extractGraphQLOperationName(queryWithComments)).toBe("HelloWorld");
  });
});

describe("parseGraphQLVariableTypes", () => {
  it("parses InterpretedName variable", () => {
    expect(parseGraphQLVariableTypes(domainByNameQuery)).toMatchObject({
      name: "InterpretedName!",
    });
  });

  it("parses Address variable", () => {
    expect(parseGraphQLVariableTypes(domainsByAddressQuery)).toMatchObject({
      address: "Address!",
    });
  });

  it("parses nested object type variable", () => {
    expect(parseGraphQLVariableTypes(registryDomainsQuery)).toMatchObject({
      registry: "AccountIdInput!",
    });
  });

  it("returns empty object when there are no variables", () => {
    expect(parseGraphQLVariableTypes(namegraphQuery)).toMatchObject({});
  });

  it("parses variables on unnamed operations", () => {
    const unnamedQuery = `query ($name: InterpretedName!) {
  domain(by: { name: $name }) { name }
}`;
    expect(parseGraphQLVariableTypes(unnamedQuery)).toMatchObject({
      name: "InterpretedName!",
    });
  });
});

describe("formatVariablesForTypeScript", () => {
  it("wraps InterpretedName values with asInterpretedName()", () => {
    const types = { name: "InterpretedName!" };
    const vars = { name: "test-name.eth" };
    const result = formatVariablesForTypeScript(vars, types);
    expect(result).toContain('asInterpretedName("test-name.eth")');
  });

  it("serializes plain address as a JSON string", () => {
    const types = { address: "Address!" };
    const vars = { address: "0x1234" };
    const result = formatVariablesForTypeScript(vars, types);
    expect(result).toContain('"0x1234"');
    expect(result).not.toContain("asInterpretedName");
  });

  it("serializes nested objects", () => {
    const types = { registry: "AccountIdInput!" };
    const vars = { registry: { chainId: 1, address: "0xabc" } };
    const result = formatVariablesForTypeScript(vars, types);
    expect(result).toContain('"chainId"');
    expect(result).toContain('"address"');
  });

  it("returns '{}' for empty variables", () => {
    expect(formatVariablesForTypeScript({}, {})).toBe("{}");
  });
});

describe("buildEnssdkSnippet", () => {
  it("includes the operation name and query", () => {
    const snippet = buildEnssdkSnippet({
      query: domainByNameQuery,
      variables: { name: "test-name.eth" },
    });
    expect(snippet).toContain("DomainByNameQuery");
    expect(snippet).toContain("domain(by: {name: $name})");
  });

  it("includes asInterpretedName import when query uses InterpretedName", () => {
    const snippet = buildEnssdkSnippet({
      query: domainByNameQuery,
      variables: { name: "test-name.eth" },
    });
    expect(snippet).toContain('import { asInterpretedName } from "enssdk"');
  });

  it("does not include asInterpretedName import for plain address vars and includes enssdk imports", () => {
    const snippet = buildEnssdkSnippet({
      query: domainsByAddressQuery,
      variables: { address: "0x205d" },
    });
    expect(snippet).not.toContain("asInterpretedName");
    expect(snippet).toContain('from "enssdk/core"');
    expect(snippet).toContain('from "enssdk/omnigraph"');
  });

  it("handles empty variables (namegraph-style)", () => {
    const snippet = buildEnssdkSnippet({ query: namegraphQuery, variables: {} });
    expect(snippet).toContain("variables: {},");
    expect(snippet).not.toContain("asInterpretedName");
  });
});

describe("buildEnskitSnippet", () => {
  it("includes OmnigraphProvider, useOmnigraphQuery, graphql from enskit, and asInterpretedName import", () => {
    const snippet = buildEnskitSnippet({
      query: domainByNameQuery,
      variables: { name: "test-name.eth" },
    });
    expect(snippet).toContain("OmnigraphProvider");
    expect(snippet).toContain("useOmnigraphQuery");
    expect(snippet).toContain('from "enskit/react/omnigraph"');
    expect(snippet).toContain("graphql");
    expect(snippet).toContain("asInterpretedName");
  });

  it("renders loading/error/data UI", () => {
    const snippet = buildEnskitSnippet({
      query: registryDomainsQuery,
      variables: { registry: { chainId: 1, address: "0x1" } },
    });
    expect(snippet).toContain("fetching");
    expect(snippet).toContain("Loading");
    expect(snippet).toContain("error.message");
    expect(snippet).toContain("JSON.stringify(");
    expect(snippet).toContain('typeof value === "bigint"');
    expect(snippet).not.toContain("asInterpretedName");
  });
});

describe("buildEnssdkSetupSnippets", () => {
  const npmSdkVersion = snapshot.sdkVersion;

  it.each(SETUP_PACKAGE_MANAGERS)("includes versioned enssdk install for %s", (pm) => {
    const snippet = buildEnssdkSetupSnippets()[pm];
    expect(snippet).toContain(`enssdk@${npmSdkVersion}`);
    expect(snippet).toContain("my-ens-script");
    expect(snippet).toContain("src/index.ts");
  });

  it("uses npm-specific commands for npm", () => {
    const snippet = buildEnssdkSetupSnippets().npm;
    expect(snippet).toContain("npm init -y");
    expect(snippet).toContain("npm pkg set");
    expect(snippet).toContain("npm install");
    expect(snippet).toContain("npm start");
  });

  it("uses pnpm-specific commands for pnpm", () => {
    const snippet = buildEnssdkSetupSnippets().pnpm;
    expect(snippet).toContain("pnpm init");
    expect(snippet).toContain("pnpm pkg set");
    expect(snippet).toContain("pnpm add");
    expect(snippet).toContain("pnpm start");
  });
});

describe("buildEnskitSetupSnippets", () => {
  const npmSdkVersion = snapshot.sdkVersion;

  it.each(SETUP_PACKAGE_MANAGERS)("includes versioned enskit and enssdk for %s", (pm) => {
    const snippet = buildEnskitSetupSnippets()[pm];
    expect(snippet).toContain(`enskit@${npmSdkVersion}`);
    expect(snippet).toContain(`enssdk@${npmSdkVersion}`);
    expect(snippet).toContain("my-ens-app");
    expect(snippet).toContain("--no-interactive --no-immediate");
  });

  it("uses npm create vite for npm", () => {
    const snippet = buildEnskitSetupSnippets().npm;
    expect(snippet).toContain("npm create vite@latest");
    expect(snippet).toContain("npm run dev");
  });

  it("uses pnpm create vite for pnpm", () => {
    const snippet = buildEnskitSetupSnippets().pnpm;
    expect(snippet).toContain("pnpm create vite@latest");
    expect(snippet).toContain("pnpm run dev");
  });
});

describe("integration snippet typechecking", () => {
  const fixtureCases = [
    {
      label: "InterpretedName domain lookup",
      query: domainByNameQuery,
      variables: { name: "test-name.eth" },
    },
    {
      label: "address domains lookup",
      query: domainsByAddressQuery,
      variables: { address: "0x205d2686da3bf33f64c17f21462c51b5ead462cf" },
    },
    {
      label: "registry domains lookup",
      query: registryDomainsQuery,
      variables: {
        registry: { chainId: 1, address: "0x31a2bb5d933557cce1b3129993193896d074db92" },
      },
    },
    {
      label: "namegraph without variables",
      query: namegraphQuery,
      variables: {},
    },
  ] as const;

  it.each(fixtureCases)("enssdk snippet typechecks ($label)", ({ query, variables }) => {
    expectIntegrationSnippetTypechecks(buildEnssdkSnippet({ query, variables }), "enssdk");
  });

  it.each(fixtureCases)("enskit snippet typechecks ($label)", ({ query, variables }) => {
    expectIntegrationSnippetTypechecks(buildEnskitSnippet({ query, variables }), "enskit");
  });

  it.each(
    activeSnapshotExamples.map(
      (example) => [example.id, example.query, example.variables] as const,
    ),
  )("enssdk snippet typechecks active snapshot %s", (_id, query, variables) => {
    expectIntegrationSnippetTypechecks(buildEnssdkSnippet({ query, variables }), "enssdk");
  });

  it.each(
    activeSnapshotExamples.map(
      (example) => [example.id, example.query, example.variables] as const,
    ),
  )("enskit snippet typechecks active snapshot %s", (_id, query, variables) => {
    expectIntegrationSnippetTypechecks(buildEnskitSnippet({ query, variables }), "enskit");
  });
});
