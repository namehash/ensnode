"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface ProfileInformationProps {
  description?: string | null;
  email?: string | null;
}

export function ProfileInformation({ description, email }: ProfileInformationProps) {
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
