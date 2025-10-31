"use client";

import { SiFarcaster, SiGithub, SiReddit, SiTelegram, SiX } from "@icons-pack/react-simple-icons";

import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { ExternalLinkWithIcon } from "@/components/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ENSAdminProfile, ENSAdminSocialLinkKey } from "@/hooks/use-ensadmin-profile";

interface SocialLinksProps {
  profile: ENSAdminProfile;
}

export function SocialLinks({ profile }: SocialLinksProps) {
  if (profile.socialLinks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="gap-3 flex flex-col md:flex-row flex-wrap">
        {profile.socialLinks.map(({ key, value }) => {
          switch (key as ENSAdminSocialLinkKey) {
            case "com.twitter": {
              return (
                <div key={key} className="inline-flex items-center gap-2">
                  <SiX size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://twitter.com/${value}`} className="text-sm">
                    @{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "com.github": {
              return (
                <div key={key} className="inline-flex items-center gap-2">
                  <SiGithub size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://github.com/${value}`} className="text-sm">
                    {value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "com.farcaster": {
              return (
                <div key={key} className="inline-flex items-center gap-2">
                  <SiFarcaster size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://warpcast.com/${value}`} className="text-sm">
                    @{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "org.telegram": {
              return (
                <div key={key} className="inline-flex items-center gap-2">
                  <SiTelegram size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://t.me/${value}`} className="text-sm">
                    @{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "com.linkedin": {
              return (
                <div key={key} className="inline-flex items-center gap-2">
                  <LinkedInIcon className="text-gray-500 size-4 fill-current" />
                  <ExternalLinkWithIcon
                    href={`https://linkedin.com/in/${value}`}
                    className="text-sm"
                  >
                    {value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "com.reddit": {
              return (
                <div key={key} className="inline-flex items-center gap-2">
                  <SiReddit size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://reddit.com/u/${value}`} className="text-sm">
                    u/{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            default:
              console.warn(`Unsupported Social provided: '${key}' with value '${value}'.`);
              return null;
          }
        })}
      </CardContent>
    </Card>
  );
}
