"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ENSAdminProfile } from "@/hooks/use-ensadmin-profile";
import { Mail } from "lucide-react";

interface ProfileInformationProps {
  profile: ENSAdminProfile;
}

export function ProfileInformation({ profile }: ProfileInformationProps) {
  const { description, email } = profile.information;

  if (!description && !email) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <div>
            <h3 className="font-medium text-sm text-gray-500 mb-1">Description</h3>
            <p className="text-sm">{description}</p>
          </div>
        )}

        {email && (
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-gray-500" />
            <a href={`mailto:${email}`} className="text-blue-600 hover:underline text-sm">
              {email}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
