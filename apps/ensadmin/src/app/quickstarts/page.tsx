"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ExternalLink,
  Database,
  PackagePlus,
  FileSearch,
  PlayCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConnectionSelector } from "@/components/connections/connection-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const QUERY_EXAMPLES = [
  {
    id: "domain-by-id",
    name: "Domain by ID",
    description: "Query a specific domain using its node ID",
    graphql: `query GetDomain($id: ID!) {
  domain(id: $id) {
    id
    name
    labelName
    labelhash
    parent {
      name
    }
    subdomains {
      id
      name
    }
    resolvedAddress {
      id
    }
    owner {
      id
    }
    registeredAt
    expiryDate
  }
}`,
  },
  {
    id: "domain-ownership",
    name: "Domain Ownership",
    description: "Find domains owned by a specific address",
    graphql: `query GetDomainsByOwner($owner: String!) {
  domains(where: { owner: $owner }, first: 10) {
    id
    name
    labelName
    expiryDate
  }
}`,
  },
  {
    id: "domain-resolver",
    name: "Domain Resolver",
    description: "Get resolver information for a domain",
    graphql: `query GetDomainResolver($id: ID!) {
  domain(id: $id) {
    id
    name
    resolver {
      id
      address
      texts
      coinTypes
    }
  }
}`,
  },
  {
    id: "domain-subdomains",
    name: "Domain Subdomains",
    description: "List all subdomains for a specific domain",
    graphql: `query GetDomainSubdomains($id: ID!) {
  domain(id: $id) {
    id
    name
    subdomains {
      id
      name
      labelName
      owner {
        id
      }
    }
  }
}`,
  },
  {
    id: "domain-text-records",
    name: "Domain Text Records",
    description: "Get text records for a domain",
    graphql: `query GetDomainTextRecords($id: ID!) {
  domain(id: $id) {
    id
    name
    texts {
      key
      value
    }
  }
}`,
  },
];

function QuerySelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentExample = searchParams.get("example") || QUERY_EXAMPLES[0].id;

  const setQueryExample = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("example", value);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const selectedExample =
    QUERY_EXAMPLES.find((ex) => ex.id === currentExample) || QUERY_EXAMPLES[0];

  return (
    <div className="space-y-4">
      <Select value={currentExample} onValueChange={setQueryExample}>
        <SelectTrigger className="w-full md:w-80">
          <SelectValue placeholder="Select a query example" />
        </SelectTrigger>
        <SelectContent>
          {QUERY_EXAMPLES.map((example) => (
            <SelectItem key={example.id} value={example.id}>
              {example.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="p-4 border rounded-md">
        <p className="text-sm font-medium mb-2">
          {selectedExample.description}
        </p>
        <CodeBlock language="graphql" className="text-xs">
          {selectedExample.graphql}
        </CodeBlock>
      </div>
    </div>
  );
}

export default function QuickstartsPage() {
  const searchParams = useSearchParams();
  const currentExample = searchParams.get("example") || QUERY_EXAMPLES[0].id;
  const selectedExample =
    QUERY_EXAMPLES.find((ex) => ex.id === currentExample) || QUERY_EXAMPLES[0];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ENSNode Quickstart
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Get started with ENSNode using your preferred client library
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">
                1
              </span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Select Your ENSNode Connection
              </h3>
              <p className="text-muted-foreground">
                Connect to an ENSNode instance that indexes the data you need.
              </p>

              <div className="max-w-[400px] mt-2 border rounded-md bg-card">
                <ConnectionSelector />
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">
                2
              </span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" />
                Install a GraphQL Client (Optional)
              </h3>
              <p className="text-muted-foreground">
                Choose a GraphQL client that fits your application's needs:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="rounded-md border p-3">
                  <p className="font-medium">Apollo Client</p>
                  <p className="text-sm text-muted-foreground">
                    Full-featured GraphQL client with caching
                  </p>
                  <pre className="text-xs bg-muted mt-2 p-2 rounded-sm overflow-x-auto">
                    npm install @apollo/client graphql
                  </pre>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">URQL</p>
                  <p className="text-sm text-muted-foreground">
                    Lightweight and extensible GraphQL client
                  </p>
                  <pre className="text-xs bg-muted mt-2 p-2 rounded-sm overflow-x-auto">
                    npm install urql graphql
                  </pre>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">GraphQL Request</p>
                  <p className="text-sm text-muted-foreground">
                    Minimal GraphQL client for simple use cases
                  </p>
                  <pre className="text-xs bg-muted mt-2 p-2 rounded-sm overflow-x-auto">
                    npm install graphql-request graphql
                  </pre>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">Native fetch</p>
                  <p className="text-sm text-muted-foreground">
                    Use built-in fetch API with no extra dependencies
                  </p>
                  <pre className="text-xs bg-muted mt-2 p-2 rounded-sm overflow-x-auto">
                    // No installation needed
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">
                3
              </span>
            </div>
            <div className="space-y-2 pt-1 w-full">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Define Your Data Requirements
              </h3>
              <p className="text-muted-foreground">
                Choose what ENS data you need.
              </p>
              <div className="mt-2">
                <Accordion
                  type="single"
                  collapsible
                  className="bg-muted/50 rounded-md"
                >
                  <AccordionItem value="best-practice" className="border-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                      <p className="text-sm font-medium">Best Practice</p>
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      <p className="text-sm text-muted-foreground">
                        When querying by ENS name, always normalize the name and
                        use namehash to calculate the node ID for stable
                        identification.
                      </p>
                      <CodeBlock language="typescript" className="text-xs mt-2">
                        {`import { namehash, normalize } from "viem/ens";

// Normalize user input according to ENSIP-15
const normalizedName = normalize("Vitalik.eth");

// Calculate the node (ID) from the normalized name
const nodeId = namehash(normalizedName);

// Use this node ID in your queries`}
                      </CodeBlock>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="mt-2">
                <QuerySelector />
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">
                4
              </span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Execute Your Query
              </h3>
              <p className="text-muted-foreground">
                Use your chosen client to execute a GraphQL query against your
                ENSNode endpoint.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Example: {selectedExample.name}
        </h2>
        <Tabs defaultValue="graphql" className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="graphql">GraphQL</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="fetch">Node.js (fetch)</TabsTrigger>
            <TabsTrigger value="graphql-request">GraphQL Request</TabsTrigger>
            <TabsTrigger value="apollo">Apollo Client</TabsTrigger>
            <TabsTrigger value="urql">URQL</TabsTrigger>
          </TabsList>

          <TabsContent value="apollo" className="rounded-md border p-4">
            <CodeBlock language="typescript" className="text-sm">
              {`import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { namehash, normalize } from 'viem/ens';

// Normalize name and get node ID
const name = "vitalik.eth";
const normalizedName = normalize(name);
const nodeId = namehash(normalizedName);

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'https://api.ens.domains/graphql',
  cache: new InMemoryCache(),
});

// Define your query using the node ID for stable identification
const QUERY = gql\`${selectedExample.graphql}\`;

// Execute the query with the node ID
client.query({
  query: QUERY,
  variables: { id: nodeId }
})
  .then(result => console.log(result.data))
  .catch(error => console.error(error));`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="urql" className="rounded-md border p-4">
            <CodeBlock language="typescript" className="text-sm">
              {`import { createClient, gql } from 'urql';
import { namehash, normalize } from 'viem/ens';

// Normalize name and get node ID
const name = "vitalik.eth";
const normalizedName = normalize(name);
const nodeId = namehash(normalizedName);

// Initialize URQL Client
const client = createClient({
  url: 'https://api.ens.domains/graphql',
});

// Define your query using the node ID for stable identification
const QUERY = gql\`${selectedExample.graphql}\`;

// Execute the query
const executeQuery = async () => {
  const result = await client.query(QUERY, { id: nodeId }).toPromise();
  console.log(result.data);
};

executeQuery();`}
            </CodeBlock>
          </TabsContent>

          <TabsContent
            value="graphql-request"
            className="rounded-md border p-4"
          >
            <CodeBlock language="typescript" className="text-sm">
              {`import { request, gql } from 'graphql-request';
import { namehash, normalize } from 'viem/ens';

// Define your endpoint
const endpoint = 'https://api.ens.domains/graphql';

// Normalize name and get node ID
const name = "vitalik.eth";
const normalizedName = normalize(name);
const nodeId = namehash(normalizedName);

// Define your query using the node ID for stable identification
const QUERY = gql\`${selectedExample.graphql}\`;

// Execute the query
const executeQuery = async () => {
  try {
    const data = await request(endpoint, QUERY, { id: nodeId });
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};

executeQuery();`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="fetch" className="rounded-md border p-4">
            <CodeBlock language="typescript" className="text-sm">
              {`// Using native fetch API
import { namehash, normalize } from 'viem/ens';

const endpoint = 'https://api.ens.domains/graphql';

// Normalize name and get node ID
const name = "vitalik.eth";
const normalizedName = normalize(name);
const nodeId = namehash(normalizedName);

// Define your query using the node ID for stable identification
const query = \`${selectedExample.graphql}\`;

// Execute the query
async function executeQuery() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: nodeId }
      }),
    });

    const result = await response.json();
    console.log(result.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

executeQuery();`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="curl" className="rounded-md border p-4">
            <CodeBlock language="bash" className="text-sm">
              {`# You'll need to calculate the node ID first (this example uses vitalik.eth's node ID)
# Node ID: 0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835

curl -X POST \\
  -H "Content-Type: application/json" \\
  --data '{ "query": ${JSON.stringify(
    selectedExample.graphql.replace(/\n/g, " ")
  ).replace(
    /"/g,
    '\\"'
  )}, "variables": { "id": "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835" } }' \\
  https://api.ens.domains/graphql`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="graphql" className="rounded-md border p-4">
            <CodeBlock language="graphql" className="text-sm">
              {`# ${selectedExample.description}
${selectedExample.graphql}

# Example variables
# {
#   "id": "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835"
# }`}
            </CodeBlock>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Useful Resources</h2>
          <p className="text-muted-foreground">
            Explore these resources to learn more about ENSNode and GraphQL best
            practices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="group transition-all hover:border-primary hover:shadow-md">
            <a
              href="https://ensnode.io/docs/usage/querying-best-practices/"
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Querying Best Practices</span>
                  <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription>
                  Learn how to optimize your GraphQL queries and improve
                  performance when working with ENS data.
                </CardDescription>
              </CardHeader>
            </a>
          </Card>

          <Card className="group transition-all hover:border-primary hover:shadow-md">
            <a
              href="https://ensnode.io/docs/concepts/what-is-ensnode"
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Understanding ENSNode</span>
                  <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription>
                  Discover what ENSNode is and how it can help you build
                  applications using ENS data.
                </CardDescription>
              </CardHeader>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
