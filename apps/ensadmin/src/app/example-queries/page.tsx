"use client";

import {SavedQuery} from "@/components/graphiql-editor";
import {BookCheck, Lightbulb, GraduationCap, Activity, type LucideIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import React from "react";


interface ExampleQuery extends SavedQuery {
    description: string;
    icon: LucideIcon;
}

const exampleQueries: ExampleQuery[] = [
    {
        operationName: "getDomains",
        id: "1",
        name: "Get Latest Domains",
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
        description: "Get the first 20 subnames of `ens.eth` ordered by name ascending",
        icon: BookCheck,
        query: `query ($first: Int!, $name: String!) {
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
        variables: JSON.stringify(
            {name: "ens.eth", first: 20}
        ),
    },
    {
        operationName: "getOwnedNames",
        id: "3",
        name: "Get Owned Names",
        description: "Get the first 20 names owned by address `0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5` ordered by name ascending",
        icon: GraduationCap,
        query: `query ($first: Int!, $orderDirection: OrderDirection!, $owner: String!) {
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
        variables: JSON.stringify(
            {
                first: 20,
                owner: "0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5",
                orderDirection: "asc"
            }
        ),
    },
    {
        operationName: "FakeExample1",
        id: "4",
        name: "Fake Example 1",
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
        description: "More detailed description of the query that could be cut after some number of characters and displayed fully in a tooltip or something",
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
]

//TODO: the whole text content will probably need adjustments
export default function ExampleQueriesPage() {
    return (
        <main className="h-full w-full p-6 flex flex-col flex-nowrap justify-start items-start gap-6">
            <header className="h-fit flex flex-col items-start justify-center">
                <h1 className="text-2xl font-semibold">Explore use cases for GraphQL queries</h1>
                <p className="text-sm text-muted-foreground mt-1">Discover, execute and modify the example queries to
                    grasp the power of ENS</p>
            </header>
            <div className="h-fit flex flex-row flex-wrap gap-4">
                {exampleQueries.map((exampleQuery) =>
                    <Button key={`ExampleQuery${exampleQuery.id}`}
                            variant="outline"
                            className={cn("justify-start gap-2 h-fit box-border py-2 pl-2 pr-3 max-w-[456px]", "hover:bg-muted")}>
                        <exampleQuery.icon />
                        <div className="text-left">
                            <h1 className="font-medium">{exampleQuery.name}</h1>
                            <p className={cn("text-xs", "text-muted-foreground")}>{exampleQuery.description.slice(0, 56)}...</p>
                            {/*TODO: figure some more elegant way to cut text*/}
                        </div>
                    </Button>
                )}
            </div>
                <Card className="w-2/3">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm">Query Code</CardTitle>
                        <Button>Open in GraphiQL editor /icon/</Button>
                    </CardHeader>
                    <CardContent>
            <pre className="p-4 rounded-lg bg-muted font-mono text-xs whitespace-pre overflow-x-auto">
              {exampleQueries[0].query}
            </pre>
                    </CardContent>
                </Card>
        </main>
    );
}