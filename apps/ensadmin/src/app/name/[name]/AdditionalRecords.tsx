"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdditionalRecordsProps {
  texts: Record<string, unknown> | null | undefined;
}

const EXCLUDED_RECORDS = [
  "description",
  "url",
  "email",
  "com.twitter",
  "com.github",
  "com.farcaster",
  "avatar",
  "header",
  "name",
];

export function AdditionalRecords({ texts }: AdditionalRecordsProps) {
  if (!texts) {
    return null;
  }

  const additionalRecords = Object.entries(texts).filter(
    ([key]) => !EXCLUDED_RECORDS.includes(key),
  );

  if (additionalRecords.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {additionalRecords.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between">
            <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">{key}</span>
            <span className="text-sm text-gray-900 ml-4 break-all">{String(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
