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
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function InspectorSummary() {
  const searchParams = useSearchParams();

  const strategy = searchParams.get("strategy") || "resolveAddress";
  const name = searchParams.get("name") || "";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-full">
        <Label htmlFor="summary-strategy" className="whitespace-nowrap">
          Strategy
        </Label>
        <Select value={strategy} disabled>
          <SelectTrigger className="w-full" id="summary-strategy">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resolveAddress">Resolve Address</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 w-full">
        <Label htmlFor="summary-name" className="whitespace-nowrap">
          Name
        </Label>
        <Input id="summary-name" value={name} className="w-full" disabled />
      </div>

      <Button asChild>
        <Link href="/inspector" className="whitespace-nowrap">
          New Inspection
        </Link>
      </Button>
    </div>
  );
}
