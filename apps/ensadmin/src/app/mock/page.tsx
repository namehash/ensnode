import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Mock() {
  return (
    <section className="flex flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Status Mocks</CardTitle>
          <CardDescription>Select a mock component to preview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/mock/config">Config</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mock/indexing-status">Indexing status</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
