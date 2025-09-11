"use client";

import { ExternalLinkWithIcon } from "@/components/identity/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiFarcaster, SiGithub, SiX } from "@icons-pack/react-simple-icons";

interface SocialLinksProps {
  twitter?: string | null;
  github?: string | null;
  farcaster?: string | null;
}

export function SocialLinks({ twitter, github, farcaster }: SocialLinksProps) {
  if (!twitter && !github && !farcaster) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {twitter && (
          <div className="flex items-center gap-2">
            <SiX size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://twitter.com/${twitter}`} className="text-sm">
              @{twitter}
            </ExternalLinkWithIcon>
          </div>
        )}

        {github && (
          <div className="flex items-center gap-2">
            <SiGithub size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://github.com/${github}`} className="text-sm">
              {github}
            </ExternalLinkWithIcon>
          </div>
        )}

        {farcaster && (
          <div className="flex items-center gap-2">
            <SiFarcaster size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://warpcast.com/${farcaster}`} className="text-sm">
              @{farcaster}
            </ExternalLinkWithIcon>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
