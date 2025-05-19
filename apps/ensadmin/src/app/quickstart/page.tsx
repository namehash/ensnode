import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Suspense } from "react";
import { Quickstarts } from "./client";

export default function QuickstartsPage() {
  return (
    <>
      <Suspense>
        <Quickstarts />
      </Suspense>
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Useful Resources</h2>
          <p className="text-muted-foreground">
            Explore these resources to learn more about ENSNode and GraphQL best practices.
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
                  Learn how to optimize your GraphQL queries and improve performance when working
                  with ENS data.
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
                  Discover what ENSNode is and how it can help you build applications using ENS
                  data.
                </CardDescription>
              </CardHeader>
            </a>
          </Card>
        </div>
      </div>
    </>
  );
}
