"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  ExternalLink,
  FileSearch,
  PackagePlus,
  PlayCircle,
} from "lucide-react";
import { ConnectionSelector } from "@/components/connections/connection-selector";

const QUERY_EXAMPLES = [
  {
    id: "names",
    name: "Names by Label",
    description: "Query names by label (exact match)",
    graphql: `query GetNamesByLabel {
  names(where: { label: "vitalik" }) {
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
  },
  {
    id: "names-substring",
    name: "Names by Substring",
    description: "Query names where label contains a substring",
    graphql: `query GetNamesBySubstring {
  names(where: { labelName_contains: "eth" }) {
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
  },
  {
    id: "domains-by-owner",
    name: "Domains by Owner",
    description: "Query domains owned by a specific address",
    graphql: `query GetDomainsByOwner {
  domains(where: { owner: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" }) {
    id
    name
    labelName
    owner {
      id
    }
  }
}`,
  },
  {
    id: "registrations",
    name: "Registration Details",
    description: "Query registration details for a domain",
    graphql: `query GetRegistrationDetails {
  registrations(where: { domain_: { name: "vitalik.eth" } }) {
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
  },
  {
    id: "text-records",
    name: "Text Records",
    description: "Query text records for a domain",
    graphql: `query GetTextRecords {
  textChangeds(where: { resolver_: { domain_: { name: "vitalik.eth" } } }) {
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

export function Quickstarts() {
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
                <FileSearch className="h-5 w-5 text-primary" />
                Explore Data with Example Queries
              </h3>
              <p className="text-muted-foreground">
                Try these example GraphQL queries to see what data is available
                in ENSNode.
              </p>

              <div className="mt-4">
                <QuerySelector />
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
              <span className="flex items-center justify-center h-8 w-8 text-lg font-bold">
                3
              </span>
            </div>
            <div className="space-y-2 pt-1">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" />
                Install Your Preferred Client
              </h3>
              <p className="text-muted-foreground">
                Set up your project with the tools you need to connect to
                ENSNode.
              </p>

              <Tabs defaultValue="js" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="rust">Rust</TabsTrigger>
                </TabsList>

                <TabsContent value="js" className="mt-2 space-y-4">
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

                <TabsContent value="python" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="bash">
                    pip install gql requests
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="rust" className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">Add to your Cargo.toml:</p>
                    <CodeBlock className="text-xs" language="toml">
                      {`[dependencies]
graphql_client = "0.13.0"
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`}
                    </CodeBlock>
                  </div>
                </TabsContent>
              </Tabs>
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
                Use the Example Code
              </h3>
              <p className="text-muted-foreground">
                Copy this example code to query ENSNode from your application.
              </p>

              <Tabs defaultValue="js" className="mt-4">
                <TabsList className="mb-4">
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="rust">Rust</TabsTrigger>
                </TabsList>

                <TabsContent value="js" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="javascript">
                    {`import { request } from 'graphql-request'

// Use the URL from your ENSNode connection
const endpoint = '${window.location.origin}/api/graphql'

async function fetchData() {
  const query = \`${selectedExample.graphql}\`

  try {
    const data = await request(endpoint, query)
    console.log(data)
    return data
  } catch (error) {
    console.error('Error:', error)
  }
}

fetchData()`}
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="python" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="python">
                    {`from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

# Use the URL from your ENSNode connection
endpoint = '${window.location.origin}/api/graphql'

# Create a transport and client
transport = RequestsHTTPTransport(url=endpoint)
client = Client(transport=transport, fetch_schema_from_transport=True)

# Define the query
query = gql("""
${selectedExample.graphql}
""")

# Execute the query
try:
    result = client.execute(query)
    print(result)
except Exception as e:
    print(f"Error: {e}")`}
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="rust" className="mt-2 space-y-4">
                  <CodeBlock className="text-xs" language="rust">
                    {`use graphql_client::{GraphQLQuery, Response};
use reqwest::Client;
use serde::{Deserialize, Serialize};

// Define your GraphQL query
#[derive(GraphQLQuery)]
#[graphql(
    schema_path = "schema.graphql",
    query_path = "query.graphql",
    response_derives = "Debug"
)]
struct ExampleQuery;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Use the URL from your ENSNode connection
    let endpoint = "${window.location.origin}/api/graphql";

    let client = Client::new();

    // Build the request body
    let variables = example_query::Variables {};
    let request_body = ExampleQuery::build_query(variables);

    // Execute the query
    let res = client.post(endpoint)
        .json(&request_body)
        .send()
        .await?;

    let response_body: Response<example_query::ResponseData> = res.json().await?;

    // Handle the response
    if let Some(data) = response_body.data {
        println!("{:?}", data);
    } else if let Some(errors) = response_body.errors {
        println!("Errors: {:?}", errors);
    }

    Ok(())
}

// Example query.graphql file would contain:
/*
${selectedExample.graphql}
*/`}
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
