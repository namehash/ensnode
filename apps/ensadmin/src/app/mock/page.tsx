"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function MockList() {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">UI Mocks</CardTitle>
          <CardDescription>Select a UI component</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={retainCurrentRawConnectionUrlParam("/mock/config-info")}>
                ENSNodeConfigInfo
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={retainCurrentRawConnectionUrlParam("/mock/indexing-stats")}>
                IndexingStats
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={retainCurrentRawConnectionUrlParam("/mock/recent-registrations")}>
                RegistrarActions
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={retainCurrentRawConnectionUrlParam("/mock/relative-time")}>
                RelativeTime
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={retainCurrentRawConnectionUrlParam("/mock/display-identity")}>
                DisplayIdentity
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
