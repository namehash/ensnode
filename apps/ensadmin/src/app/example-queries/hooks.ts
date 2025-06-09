import { SavedQuery } from "@/components/graphiql-editor";
import type { LucideIcon } from "lucide-react";
import { BookCheck, GraduationCap, Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";

interface ExampleQuery extends SavedQuery {
  /**
   * Short query description for list of examples
   */
  shortDescription: string; //TODO: could be renamed to sth like "catchphrase"
  /**
   * More detailed query description for "Query Code" panel
   */
  longDescription: string; //TODO: if the above is renamed, this could be just "description"
  icon: LucideIcon;
}

//TODO: make this hook inject chosen query into GraphiQL editor in Subgraph-style panel - or figure out some sensible alternative (cause the 1st proposed approach is probably wrong)
export function useExampleQueries() {
  const [selectedExampleQueryIndex, selectExampleQuery] = useState(0);

  const snippets = useMemo(
    () =>
      [
        {
          operationName: "getDomains",
          id: "1",
          name: "Get Latest Domains",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
        {
          operationName: "getSubnames",
          id: "2",
          name: "Get Subnames",
          shortDescription: "Get the first 20 subnames",
          longDescription: "Get the first 20 subnames of `ens.eth` ordered by name ascending",
          icon: BookCheck,
          query: `query GetSubnames($first: Int!, $name: String!) {
  domains(first: 1, where: {name: $name}) {
    subdomains(first: $first, orderBy: name, orderDirection: asc) {
      id
      labelName
      name
      owner {
        id
      }
    }
  }
}
    `,
          variables: JSON.stringify({ name: "ens.eth", first: 20 }),
        },
        {
          operationName: "getOwnedNames",
          id: "3",
          name: "Get Owned Names",
          shortDescription: "Get the first 20 names owned by given address",
          longDescription:
            "Get the first 20 names owned by address `0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5` ordered by name ascending",
          icon: GraduationCap,
          query: `query GetOwnedNames($first: Int!, $orderDirection: OrderDirection!, $owner: String!) {
  domains(
    first: $first
    orderBy: name
    orderDirection: $orderDirection
    where: {owner: $owner}
  ) {
    id
    labelName
    name
    owner {
      id
    }
  }
}
    `,
          variables: JSON.stringify({
            first: 20,
            owner: "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5",
            orderDirection: "asc",
          }),
        },
        {
          operationName: "FakeExample1",
          id: "4",
          name: "Fake Example 1",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
        {
          operationName: "FakeExample2",
          id: "5",
          name: "Fake Example 2",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
        {
          operationName: "FakeExample3",
          id: "6",
          name: "Fake Example 3",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
        {
          operationName: "FakeExample4",
          id: "7",
          name: "Fake Example 4",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
        {
          operationName: "FakeExample5",
          id: "8",
          name: "Fake Example 5",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
        {
          operationName: "FakeExample6",
          id: "9",
          name: "Fake Example 6",
          shortDescription: "Description of the query",
          longDescription:
            "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
          icon: Lightbulb,
          query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
          variables: JSON.stringify(
            {
              first: 5,
            },
            null,
            2,
          ),
        },
      ] as Array<ExampleQuery>,
    [],
  );

  return {
    selectedExampleQueryIndex,
    allExampleQueries: snippets,
    selectExampleQuery,
    selectedExampleQuery: snippets[selectedExampleQueryIndex],
  };
}
