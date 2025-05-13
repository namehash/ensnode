"use client";

import { ConnectionSelector } from "@/components/connections/connection-selector";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { selectedEnsNodeUrl } from "@/lib/env";
import { Database, ExternalLink, FileSearch, PackagePlus, PlayCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const QUERY_EXAMPLES = [
  {
    id: "names",
    name: "Names by Label",
    description: "Query names by label (exact match)",
    graphql: `query GetNamesByLabel($label: String!) {
  names(where: { label: $label }) {
    id
    labelName
    wrappedOwner {
      id
    }
    resolvedAddress {
      id
    }
    expiryDate
  }
}`,
    variables: {
      label: "vitalik",
    },
  },
  {
    id: "names-substring",
    name: "Names by Substring",
    description: "Query names where label contains a substring",
    graphql: `query GetNamesBySubstring($substring: String!) {
  names(where: { labelName_contains: $substring }) {
    id
    labelName
    wrappedOwner {
      id
    }
    resolvedAddress {
      id
    }
    expiryDate
  }
}`,
    variables: {
      substring: "eth",
    },
  },
  {
    id: "domains-by-owner",
    name: "Domains by Owner",
    description: "Query domains owned by a specific address",
    graphql: `query GetDomainsByOwner($owner: String!) {
  domains(where: { owner: $owner }) {
    id
    name
    labelName
    owner {
      id
    }
  }
}`,
    variables: {
      owner: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    },
  },
  {
    id: "registrations",
    name: "Registration Details",
    description: "Query registration details for a domain",
    graphql: `query GetRegistrationDetails($name: String!) {
  registrations(where: { domain_: { name: $name } }) {
    id
    registrationDate
    expiryDate
    domain {
      id
      name
      labelName
    }
  }
}`,
    variables: {
      name: "vitalik.eth",
    },
  },
  {
    id: "text-records",
    name: "Text Records",
    description: "Query text records for a domain",
    graphql: `query GetTextRecords($name: String!) {
  textChangeds(where: { resolver_: { domain_: { name: $name } } }) {
    id
    key
    value
    resolver {
      domain {
        name
      }
    }
  }
}`,
    variables: {
      name: "vitalik.eth",
    },
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
    [searchParams, router],
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
        <p className="text-sm font-medium mb-2">{selectedExample.description}</p>
        <CodeBlock language="graphql" className="text-xs">
          {selectedExample.graphql}
        </CodeBlock>
        <div className="mt-2">
          <p className="text-sm font-medium mb-1">Variables:</p>
          <CodeBlock language="json" className="text-xs">
            {JSON.stringify(selectedExample.variables, null, 2)}
          </CodeBlock>
        </div>
      </div>
    </div>
  );
}

export function Quickstarts() {
  const searchParams = useSearchParams();
  const currentExample = searchParams.get("example") || QUERY_EXAMPLES[0].id;
  const selectedExample =
    QUERY_EXAMPLES.find((ex) => ex.id === currentExample) || QUERY_EXAMPLES[0];

  const selectedUrl = selectedEnsNodeUrl(searchParams);
  const graphqlEndpoint = new URL("/api/graphql", selectedUrl).toString();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ENSNode Quickstart</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Get started with ENSNode using your preferred client library
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">1</span>
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
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">2</span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Explore Data with Example Queries
              </h3>
              <p className="text-muted-foreground">
                Try these example GraphQL queries to see what data is available in ENSNode.
              </p>

              <div className="mt-4">
                <QuerySelector />
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">3</span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" />
                Install Your Preferred Client
              </h3>
              <p className="text-muted-foreground">
                Set up your project with the tools you need to connect to ENSNode.
              </p>

              <Tabs defaultValue="apollo" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="apollo">Apollo Client</TabsTrigger>
                  <TabsTrigger value="fetch">Node.js (Fetch)</TabsTrigger>
                  <TabsTrigger value="graphql-request">graphql-request</TabsTrigger>
                  <TabsTrigger value="urql">urql</TabsTrigger>
                </TabsList>

                <TabsContent value="apollo" className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Using npm</h4>
                    <CodeBlock className="text-xs" language="bash">
                      npm install @apollo/client graphql
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Using yarn</h4>
                    <CodeBlock className="text-xs" language="bash">
                      yarn add @apollo/client graphql
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Using pnpm</h4>
                    <CodeBlock className="text-xs" language="bash">
                      pnpm add @apollo/client graphql
                    </CodeBlock>
                  </div>
                </TabsContent>

                <TabsContent value="fetch" className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">Node.js has the Fetch API built-in (in Node.js 18+)</p>
                  </div>
                </TabsContent>

                <TabsContent value="graphql-request" className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Using npm</h4>
                    <CodeBlock className="text-xs" language="bash">
                      npm install graphql graphql-request
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Using yarn</h4>
                    <CodeBlock className="text-xs" language="bash">
                      yarn add graphql graphql-request
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Using pnpm</h4>
                    <CodeBlock className="text-xs" language="bash">
                      pnpm add graphql graphql-request
                    </CodeBlock>
                  </div>
                </TabsContent>

                <TabsContent value="urql" className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Using npm</h4>
                    <CodeBlock className="text-xs" language="bash">
                      npm install urql graphql
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Using yarn</h4>
                    <CodeBlock className="text-xs" language="bash">
                      yarn add urql graphql
                    </CodeBlock>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Using pnpm</h4>
                    <CodeBlock className="text-xs" language="bash">
                      pnpm add urql graphql
                    </CodeBlock>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">4</span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Use the Example Code
              </h3>
              <p className="text-muted-foreground">
                Copy this example code to query ENSNode from your application.
              </p>

              <Tabs defaultValue="apollo" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="apollo">Apollo Client</TabsTrigger>
                  <TabsTrigger value="fetch">Node.js (Fetch)</TabsTrigger>
                  <TabsTrigger value="graphql-request">graphql-request</TabsTrigger>
                  <TabsTrigger value="urql">urql</TabsTrigger>
                </TabsList>

                <TabsContent value="apollo" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="javascript">
                    {`import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Use the URL from your ENSNode connection
const client = new ApolloClient({
  uri: '${graphqlEndpoint}',
  cache: new InMemoryCache(),
});

async function fetchData() {
  const QUERY = gql\`${selectedExample.graphql}\`;
  
  // Variables for the query
  const variables = ${JSON.stringify(selectedExample.variables, null, 2)};

  try {
    const { data } = await client.query({
      query: QUERY,
      variables: variables,
    });
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchData();`}
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="fetch" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="javascript">
                    {`// Use the URL from your ENSNode connection
const endpoint = '${graphqlEndpoint}';

async function fetchData() {
  const query = \`${selectedExample.graphql}\`;
  
  // Variables for the query
  const variables = ${JSON.stringify(selectedExample.variables, null, 2)};

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const { data, errors } = await response.json();
    
    if (errors) {
      console.error('GraphQL Errors:', errors);
      return;
    }
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Network Error:', error);
  }
}

fetchData();`}
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="graphql-request" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="javascript">
                    {`import { request, gql } from 'graphql-request';

// Use the URL from your ENSNode connection
const endpoint = '${graphqlEndpoint}';

async function fetchData() {
  const query = gql\`${selectedExample.graphql}\`;
  
  // Variables for the query
  const variables = ${JSON.stringify(selectedExample.variables, null, 2)};

  try {
    const data = await request({
      url: endpoint,
      document: query,
      variables: variables,
    });
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchData();`}
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="urql" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="javascript">
                    {`import { createClient, gql } from 'urql';

// Use the URL from your ENSNode connection
const client = createClient({
  url: '${graphqlEndpoint}',
});

async function fetchData() {
  const QUERY = gql\`${selectedExample.graphql}\`;
  
  // Variables for the query
  const variables = ${JSON.stringify(selectedExample.variables, null, 2)};

  try {
    const { data, error } = await client.query(QUERY, variables).toPromise();
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Network Error:', error);
  }
}

fetchData();`}
                  </CodeBlock>
                </TabsContent>
              </Tabs>

              <div className="mt-4 flex items-center">
                <p className="text-sm mr-2">
                  For more examples and detailed documentation, visit our docs:
                </p>
                <a
                  href="https://docs.ensnode.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  docs.ensnode.org
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
