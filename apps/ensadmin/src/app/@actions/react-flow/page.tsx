"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActionsReactFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStrategy = searchParams.get("strategy") || "resolveAddress";
  const initialName = searchParams.get("name") || "jesse.base.eth";

  const [strategy, setStrategy] = useState(initialStrategy);
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    params.set("strategy", strategy);
    params.set("name", name);

    router.push(`?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="strategy" className="whitespace-nowrap">
          Strategy
        </Label>
        <Select value={strategy} onValueChange={setStrategy} disabled>
          <SelectTrigger className="w-[180px]" id="strategy">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resolveAddress">Resolve Address</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="name" className="whitespace-nowrap">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-[250px]"
          disabled
        />
      </div>

      <Button type="submit" disabled>
        Inspect
      </Button>
    </form>
  );
}
