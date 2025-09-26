"use client";

import { getNameDetailsRelativePath } from "@/components/identity/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Name } from "@ensnode/ensnode-sdk";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

export default function NameNavigationPage() {
  //TODO: theoretically, the "View Name" button could just be a child of the <Link> component,
  // but I feel like this violates how <form> should work, hence the useRouter approach
  const router = useRouter();
  const [searchedName, setSearchedName] = useState<string>("");

  //TODO: For now pressing enter will only submit the form if the input is focused.
  // Not sure if that satisfies this requirement:
  // 'If the form is "submittable" then pressing enter should automatically submit the form.'
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("ens-name") as Name;

    //TODO: should we automatically check for and&or add ".eth" TLD?
    // I am unsure how this adheres to this requirement: "For now, there will be no validation or transformations
    // on the input into this field. All inputs will be valid and interpreted literally."
    // is to be satisfied.
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
          {/*//TODO: Maybe we could create a short list of example names for users to pick from?
                    Similarly to how it's done in the 'RecordsResolution' ?*/}
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
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
              <Button type="submit" disabled={searchedName.length === 0} className="max-sm:self-stretch">
                View Name
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
