"use client";

import { useMemo } from "react";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";
import { SiFarcaster, SiGithub, SiReddit, SiTelegram, SiX } from "@icons-pack/react-simple-icons";

const SOCIAL_LINK_KEYS = [
  "com.twitter",
  "com.farcaster",
  "com.github",
  "org.telegram",
  "com.linkedin",
  "com.reddit",
] as const;

type SocialLinkKey = (typeof SOCIAL_LINK_KEYS)[number];
type SocialLinkValue = string;

export function SocialLinks({
  links,
}: { links: { key: SocialLinkKey; value: SocialLinkValue }[] }) {
  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="gap-3 flex flex-col md:flex-row flex-wrap">
        {links.map(({ key, value }) => {
          switch (key) {
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

SocialLinks.Texts = function SocialLinksTexts({
  texts,
}: { texts: Record<string, string | null | undefined> }) {
  const links = useMemo(
    () =>
      SOCIAL_LINK_KEYS
        // map social keys to a set of links
        .map((key) => ({ key, value: texts[key] }))
        // filter those links by those that exist
        .filter(
          (link): link is { key: SocialLinkKey; value: SocialLinkValue } =>
            typeof link.value === "string",
        ),
    [texts],
  );

  return <SocialLinks links={links} />;
};
