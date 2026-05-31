import {
  type FieldNode,
  GraphQLObjectType,
  type GraphQLResolveInfo,
  GraphQLString,
  parse,
} from "graphql";
import { describe, expect, it } from "vitest";

import { buildProfileSelectionFromResolveContainerInfo } from "./build-profile-selection";

const DomainProfileType = new GraphQLObjectType({
  name: "DomainProfile",
  fields: {
    description: { type: GraphQLString },
    avatar: { type: GraphQLString },
    header: { type: GraphQLString },
    website: { type: GraphQLString },
    socials: { type: GraphQLString },
    addresses: { type: GraphQLString },
  },
});

const DomainResolveType = new GraphQLObjectType({
  name: "DomainResolve",
  fields: {
    profile: { type: DomainProfileType },
    records: { type: GraphQLString },
  },
});

function parseResolveFieldNode(subselection: string): FieldNode {
  const document = parse(`{ resolve { ${subselection} } }`);
  const operation = document.definitions[0];
  if (operation?.kind !== "OperationDefinition") throw new Error("expected operation");
  const resolveField = operation.selectionSet.selections[0];
  if (resolveField?.kind !== "Field") throw new Error("expected field");
  return resolveField;
}

function resolveInfoForSubselection(subselection: string): GraphQLResolveInfo {
  return {
    fieldNodes: [parseResolveFieldNode(subselection)],
    fragments: {},
    returnType: DomainResolveType,
    variableValues: {},
  } as unknown as GraphQLResolveInfo;
}

describe("buildProfileSelectionFromResolveContainerInfo", () => {
  it.each([
    ["description", "profile { description }", { texts: ["description"] }],
    ["avatar", "profile { avatar { httpUrl } }", { texts: ["avatar"] }],
    ["header", "profile { header { httpUrl } }", { texts: ["header"] }],
    ["website", "profile { website { httpUrl } }", { texts: ["url"] }],
    [
      "socials.github",
      "profile { socials { github { handle httpUrl } } }",
      { texts: ["com.github"] },
    ],
    [
      "socials.twitter",
      "profile { socials { twitter { handle httpUrl } } }",
      { texts: ["com.twitter"] },
    ],
    [
      "socials.telegram",
      "profile { socials { telegram { handle httpUrl } } }",
      { texts: ["org.telegram"] },
    ],
    ["addresses.ethereum", "profile { addresses { ethereum } }", { addresses: [60] }],
    ["addresses.base", "profile { addresses { base } }", { addresses: [2147492101] }],
    ["addresses.bitcoin", "profile { addresses { bitcoin } }", { addresses: [0] }],
    ["addresses.solana", "profile { addresses { solana } }", { addresses: [501] }],
    [
      "multiple profile sub-fields",
      `
      profile {
        description
        avatar { httpUrl }
        socials {
          github { handle }
          twitter { handle }
        }
        addresses {
          ethereum
          bitcoin
        }
      }
    `,
      {
        texts: ["description", "avatar", "com.github", "com.twitter"],
        addresses: [60, 0],
      },
    ],
  ])("builds selection for %s", (_message, subselection, expected) => {
    expect(
      buildProfileSelectionFromResolveContainerInfo(resolveInfoForSubselection(subselection)),
    ).toEqual(expected);
  });

  it.each([
    ["profile not selected", "records { __typename }"],
    ["profile without recognized sub-fields", "profile { __typename }"],
  ])("returns null: %s", (_message, subselection) => {
    expect(
      buildProfileSelectionFromResolveContainerInfo(resolveInfoForSubselection(subselection)),
    ).toBeNull();
  });

  it("builds selection from inline fragments within profile selection", () => {
    const doc = parse(`
      fragment ProfileFields on DomainProfile {
        description
        avatar { httpUrl }
      }
      { resolve { profile { ...ProfileFields } } }
    `);
    const operation = doc.definitions.find((d) => d.kind === "OperationDefinition");
    if (!operation || operation.kind !== "OperationDefinition") throw new Error();
    const fragments: Record<string, (typeof doc.definitions)[number]> = {};
    for (const def of doc.definitions) {
      if (def.kind === "FragmentDefinition") {
        fragments[def.name.value] = def;
      }
    }
    const resolveField = operation.selectionSet.selections[0];
    if (!resolveField || resolveField.kind !== "Field") throw new Error();

    const info: GraphQLResolveInfo = {
      fieldNodes: [resolveField],
      fragments,
      returnType: DomainResolveType,
      variableValues: {},
    } as unknown as GraphQLResolveInfo;

    expect(buildProfileSelectionFromResolveContainerInfo(info)).toEqual({
      texts: ["description", "avatar"],
    });
  });
});
