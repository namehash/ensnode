"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function QuickstartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ENSNode Quickstart
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Get started with ENSNode using your preferred client library
        </p>
      </div>

      <div className="space-y-4">
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

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'https://api.ens.domains/graphql',
  cache: new InMemoryCache(),
});

// Define your query
const GET_DOMAINS = gql\`
  query GetDomains {
    domains(first: 5) {
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
  }
\`;

// Execute the query
client.query({
  query: GET_DOMAINS
})
  .then(result => console.log(result.data))
  .catch(error => console.error(error));`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="urql" className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">URQL</h3>
            <CodeBlock language="typescript" className="text-sm">
              {`import { createClient, gql } from 'urql';

// Initialize URQL Client
const client = createClient({
  url: 'https://api.ens.domains/graphql',
});

// Define your query
const GET_DOMAINS = gql\`
  query GetDomains {
    domains(first: 5) {
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
  }
\`;

// Execute the query
const getDomains = async () => {
  const result = await client.query(GET_DOMAINS).toPromise();
  console.log(result.data);
};

getDomains();`}
            </CodeBlock>
          </TabsContent>

          <TabsContent
            value="graphql-request"
            className="rounded-md border p-4"
          >
            <CodeBlock language="typescript" className="text-sm">
              {`import { request, gql } from 'graphql-request';

// Define your endpoint
const endpoint = 'https://api.ens.domains/graphql';

// Define your query
const GET_DOMAINS = gql\`
  query GetDomains {
    domains(first: 5) {
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
  }
\`;

// Execute the query
const getDomains = async () => {
  try {
    const data = await request(endpoint, GET_DOMAINS);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};

getDomains();`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="fetch" className="rounded-md border p-4">
            <CodeBlock language="typescript" className="text-sm">
              {`// Using native fetch API
const endpoint = 'https://api.ens.domains/graphql';

// Define your query
const query = \`
  query GetDomains {
    domains(first: 5) {
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
  }
\`;

// Execute the query
async function getDomains() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    console.log(result.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

getDomains();`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="curl" className="rounded-md border p-4">
            <CodeBlock language="bash" className="text-sm">
              {`curl -X POST \\
  -H "Content-Type: application/json" \\
  --data '{ "query": "{ domains(first: 5) { id name labelName labelhash parent { name } subdomains { id name } resolvedAddress { id } owner { id } registeredAt expiryDate } }" }' \\
  https://api.ens.domains/graphql`}
            </CodeBlock>
          </TabsContent>

          <TabsContent value="graphql" className="rounded-md border p-4">
            <CodeBlock language="graphql" className="text-sm">
              {`query GetDomains {
  domains(first: 5) {
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
}`}
            </CodeBlock>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6 pt-6">
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
