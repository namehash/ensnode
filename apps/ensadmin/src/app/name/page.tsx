"use client";

import { NameDisplay } from "@namehash/namehash-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent, useMemo, useState } from "react";

import { ENSNamespaceIds } from "@ensnode/datasources";
import {
  getNamespaceSpecificValue,
  isInterpretedName,
  isNormalizedName,
  type Name,
  type NamespaceSpecificValue,
  type NormalizedName,
} from "@ensnode/ensnode-sdk";

import { getNameDetailsRelativePath, NameLink } from "@/components/name-links";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import {
  interpretNameFromUserInput,
  NameInterpretationOutcomeResult,
} from "@/lib/interpret-name-from-user-input";

import { NameDetailPageContent } from "./_components/NameDetailPageContent";
import { InterpretedNameUnsupportedError, UnnormalizedNameError } from "./_components/NameErrors";

const EXAMPLE_NAMES: NamespaceSpecificValue<NormalizedName[]> = {
  default: [
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
  ] as NormalizedName[],
  [ENSNamespaceIds.Sepolia]: [
    "gregskril.eth",
    "vitalik.eth",
    "myens.eth",
    "recordstest.eth",
    "arrondesean.eth",
    "decode.eth",
  ] as NormalizedName[],
  [ENSNamespaceIds.EnsTestEnv]: [
    "alias.eth",
    "changerole.eth",
    "demo.eth",
    "example.eth",
    "linked.parent.eth",
    "parent.eth",
    "renew.eth",
    "reregister.eth",
    "sub1.sub2.parent.eth",
    "sub2.parent.eth",
    "test.eth",
    "wallet.linked.parent.eth",
  ] as NormalizedName[],
};

export default function ExploreNamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameFromQuery = searchParams.get("name") as Name | null;
  const [rawInputName, setRawInputName] = useState<Name>("");
  const [formError, setFormError] = useState<string | null>(null);

  const namespace = useActiveNamespace();
  const exampleNames = useMemo(
    () => getNamespaceSpecificValue(namespace, EXAMPLE_NAMES),
    [namespace],
  );

  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const result = interpretNameFromUserInput(rawInputName);

    switch (result.outcome) {
      case NameInterpretationOutcomeResult.Empty:
        break;
      case NameInterpretationOutcomeResult.Normalized: {
        const href = retainCurrentRawConnectionUrlParam(
          getNameDetailsRelativePath(result.interpretation),
        );
        router.push(href);
        break;
      }
      case NameInterpretationOutcomeResult.Reencoded:
        setFormError(
          "The provided input contains encoded labelhashes. Support for resolving names with encoded labelhashes is in progress and coming soon.",
        );
        break;
      case NameInterpretationOutcomeResult.Encoded:
        setFormError("The provided input is not a valid ENS name.");
        break;
    }
  };

  const handleRawInputNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setFormError(null);
    setRawInputName(e.target.value);
  };

  // Detail page: validate name from query params using only validation checks (no normalization).
  // see: https://github.com/namehash/ensnode/issues/1140
  if (nameFromQuery !== null && nameFromQuery !== "") {
    if (isNormalizedName(nameFromQuery)) {
      return <NameDetailPageContent name={nameFromQuery} />;
    }

    if (isInterpretedName(nameFromQuery)) {
      return <InterpretedNameUnsupportedError />;
    }

    return <UnnormalizedNameError />;
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
                disabled={rawInputName.trim().length === 0}
                className="max-sm:self-stretch"
              >
                View Profile
              </Button>
            </fieldset>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </form>
          <div className="flex flex-col gap-2 justify-center">
            <p className="text-sm font-medium leading-none">Examples:</p>
            <div className="flex flex-row flex-wrap gap-2 -mx-6 px-6">
              {exampleNames.map((exampleName) => (
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
