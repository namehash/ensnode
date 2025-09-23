"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";

interface AdditionalRecordsProps {
  texts: Record<string, unknown> | null | undefined;
}

const RECORDS_ALREADY_DISPLAYED_ELSEWHERE = [
  "description",
  "url",
  "email",
  "com.twitter",
  "com.github",
  "com.farcaster",
  "org.telegram",
  "com.linkedin",
  "com.reddit",
  "avatar",
  "header",
  "name",
];

export function AdditionalRecords({ texts }: AdditionalRecordsProps) {
  if (!texts) return null;

  const records = Object.entries(texts).filter(
    ([key]) => !RECORDS_ALREADY_DISPLAYED_ELSEWHERE.includes(key),
  );

  if (records.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between">
            <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">{key}</span>
            <span className="text-sm text-gray-900 ml-4 break-all">{String(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
