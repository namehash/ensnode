"use client";

import { useState } from "react";

import { DisplayRecentRegistrations } from "@/components/recent-registrations/display-recent-registrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { variants } from "./mocks";

const variantIds = [...variants.keys()];

export default function MockRegistrationsPage() {
  const title = "Recent registrations and renewals";

  const [selectedVariant, setSelectedVariant] = useState(variantIds[0]);
  const resolvedRecentRegistrations = variants.get(selectedVariant);

  if (!resolvedRecentRegistrations) {
    return <>Could not resolve mocked recent registrations for "{selectedVariant}" variant.</>;
  }

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: RecentRegistrations</CardTitle>
          <CardDescription>Select a mock RecentRegistrations variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variantIds.map((variantId) => (
              <Button
                key={variantId}
                variant={selectedVariant === variantId ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariant(variantId)}
              >
                {variantId}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <DisplayRecentRegistrations
            title={title}
            resolvedRecentRegistrations={resolvedRecentRegistrations}
          />
        </CardContent>
      </Card>{" "}
    </section>
  );
}
