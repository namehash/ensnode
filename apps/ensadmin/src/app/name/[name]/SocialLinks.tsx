"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiFarcaster, SiGithub, SiReddit, SiTelegram, SiX } from "@icons-pack/react-simple-icons";

interface SocialLinksProps {
  twitter?: string | null;
  github?: string | null;
  farcaster?: string | null;
  telegram?: string | null;
  linkedin?: string | null;
  reddit?: string | null;
}

export function SocialLinks({
  twitter,
  github,
  farcaster,
  telegram,
  linkedin,
  reddit,
}: SocialLinksProps) {
  const socialLinks = [twitter, github, farcaster, telegram, linkedin, reddit];

  if (!socialLinks.some(Boolean)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="gap-3 flex flex-col md:flex-row flex-wrap">
        {twitter && (
          <div className="inline-flex items-center gap-2">
            <SiX size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://twitter.com/${twitter}`} className="text-sm">
              @{twitter}
            </ExternalLinkWithIcon>
          </div>
        )}

        {github && (
          <div className="inline-flex items-center gap-2">
            <SiGithub size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://github.com/${github}`} className="text-sm">
              {github}
            </ExternalLinkWithIcon>
          </div>
        )}

        {farcaster && (
          <div className="inline-flex items-center gap-2">
            <SiFarcaster size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://warpcast.com/${farcaster}`} className="text-sm">
              @{farcaster}
            </ExternalLinkWithIcon>
          </div>
        )}

        {telegram && (
          <div className="inline-flex items-center gap-2">
            <SiTelegram size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://t.me/${telegram}`} className="text-sm">
              @{telegram}
            </ExternalLinkWithIcon>
          </div>
        )}

        {linkedin && (
          <div className="inline-flex items-center gap-2">
            <LinkedInIcon className="text-gray-500 size-4 fill-current" />
            <ExternalLinkWithIcon href={`https://linkedin.com/in/${linkedin}`} className="text-sm">
              {linkedin}
            </ExternalLinkWithIcon>
          </div>
        )}

        {reddit && (
          <div className="inline-flex items-center gap-2">
            <SiReddit size={16} className="text-gray-500" />
            <ExternalLinkWithIcon href={`https://reddit.com/u/${reddit}`} className="text-sm">
              u/{reddit}
            </ExternalLinkWithIcon>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
