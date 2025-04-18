"use client";

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
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type InspectorFormProps = {
  className?: string;
};

export default function InspectorForm({ className = "" }: InspectorFormProps) {
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
    <form onSubmit={handleSubmit} className={cn("flex gap-4", className)}>
      <div className="flex items-center gap-2 w-full">
        <Label htmlFor="strategy" className="whitespace-nowrap">
          Strategy
        </Label>
        <Select value={strategy} onValueChange={setStrategy} disabled>
          <SelectTrigger className="w-full" id="strategy">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resolveAddress">Resolve Address</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 w-full">
        <Label htmlFor="name" className="whitespace-nowrap">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          disabled
        />
      </div>

      <Button type="submit" className="whitespace-nowrap">
        Inspect
      </Button>
    </form>
  );
}
