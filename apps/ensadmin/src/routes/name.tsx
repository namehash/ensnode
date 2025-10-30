import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ChangeEvent, useState } from "react";

import type { Name } from "@ensnode/ensnode-sdk";

import { getNameDetailsRelativePath, NameDisplay, NameLink } from "@/components/identity/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

import { NameDetailPageContent } from "../app/name/_components/NameDetailPageContent";

// Define search params schema
type NameSearchParams = {
  name?: string;
};

export const Route = createFileRoute("/name")({
  component: ExploreNamesPage,
  validateSearch: (search: Record<string, unknown>): NameSearchParams => {
    return {
      name: (search.name as string) || undefined,
    };
  },
});

const EXAMPLE_NAMES = [
  "vitalik.eth",
  "gregskril.eth",
  "katzman.base.eth",
  "jesse.base.eth",
  "alain.linea.eth",
  "goinfrex.linea.eth",
  "gift.box",
  "barmstrong.cb.id",
  "argent.xyz",
  "lens.xyz",
  "brantly.eth",
  "lightwalker.eth",
];

function ExploreNamesPage() {
  const navigate = useNavigate();
  const { name: nameFromQuery } = Route.useSearch();
  const [rawInputName, setRawInputName] = useState<Name>("");

  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO: Input validation and normalization.
    // see: https://github.com/namehash/ensnode/issues/1140

    const href = retainCurrentRawConnectionUrlParam(getNameDetailsRelativePath(rawInputName));

    navigate({ to: href as any });
  };

  const handleRawInputNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    setRawInputName(e.target.value);
  };

  if (nameFromQuery) {
    return <NameDetailPageContent name={nameFromQuery} />;
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      <Card className="w-full">
        <CardHeader className="sm:pb-4 max-sm:p-3">
          <CardTitle className="text-2xl">Explore ENS Names</CardTitle>
        </CardHeader>
        <CardContent className="max-sm:px-3 max-sm:pb-3">
          <form className="flex flex-col gap-2 pb-3 sm:pb-4" onSubmit={handleSubmit}>
            <fieldset className="flex flex-col sm:flex-row gap-2 justify-start items-center">
              <Input
                autoFocus
                type="text"
                required
                id="ens-name"
                name="ens-name"
                placeholder="Search for a name..."
                value={rawInputName}
                onChange={handleRawInputNameChange}
              />
              <Button
                type="submit"
                disabled={rawInputName.length === 0}
                className="max-sm:self-stretch"
              >
                View Profile
              </Button>
            </fieldset>
          </form>
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-medium leading-none">Examples:</p>
            <div className="flex flex-row flex-wrap gap-2 -mx-6 px-6">
              {EXAMPLE_NAMES.map((exampleName) => (
                <NameLink name={exampleName} key={`example-name-link-${exampleName}`}>
                  <Button
                    variant={"outline"}
                    size="sm"
                    key={`example-name-button-${exampleName}`}
                    className="font-mono rounded-full"
                    asChild
                  >
                    <NameDisplay name={exampleName} />
                  </Button>
                </NameLink>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
