"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ENSAdminProfile } from "@/hooks/use-ensadmin-profile";

interface AdditionalRecordsProps {
  profile: ENSAdminProfile;
}

export function AdditionalRecords({ profile }: AdditionalRecordsProps) {
  if (profile.additionalTextRecords.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.additionalTextRecords.map(({ key, value }) => (
          <div key={key} className="flex items-start justify-between">
            <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">{key}</span>
            <span className="text-sm text-gray-900 ml-4 break-all">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
