"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ENSAdminProfile } from "@/hooks/use-ensadmin-profile";

interface AddressesProps {
  profile: ENSAdminProfile;
}

export function Addresses({ profile }: AddressesProps) {
  if (profile.addresses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Addresses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.addresses.map(({ coinType, address }) => (
          <div key={coinType} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Coin Type {coinType}</span>
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{address}</code>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
