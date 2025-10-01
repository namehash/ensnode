"use client";

import { NameDisplay, NameLink, getNameDetailsRelativePath } from "@/components/identity/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Name } from "@ensnode/ensnode-sdk";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

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

export default function ExploreNamesPage() {
  const router = useRouter();
  const [searchedName, setSearchedName] = useState<Name>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("ens-name") as Name;

    //TODO: validation is to be established.
    // Since it brings a significant amount of complexity it's preferable
    // to not do it at all until we do it right.
    router.push(getNameDetailsRelativePath(name));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    setSearchedName(e.target.value);
  };

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
                value={searchedName}
                onChange={handleChange}
              />
              <Button
                type="submit"
                disabled={searchedName.length === 0}
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
