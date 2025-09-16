"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiFarcaster, SiGithub, SiReddit, SiTelegram, SiX } from "@icons-pack/react-simple-icons";

const SOCIAL_LINK_KEYS = [
  "twitter",
  "github",
  "farcaster",
  "telegram",
  "linkedin",
  "reddit",
] as const;

type SocialLinkKey = (typeof SOCIAL_LINK_KEYS)[number];
type SocialLinkValue = string | null;

export function SocialLinks({
  links,
}: { links: { key: SocialLinkKey; value: SocialLinkValue }[] }) {
  const linksWithValue = links.filter(({ value }) => !!value);
  if (linksWithValue.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="gap-3 flex flex-col md:flex-row flex-wrap">
        {linksWithValue.map(({ key, value }) => {
          switch (key) {
            case "twitter": {
              return (
                <div className="inline-flex items-center gap-2">
                  <SiX size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://twitter.com/${value}`} className="text-sm">
                    @{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "github": {
              return (
                <div className="inline-flex items-center gap-2">
                  <SiGithub size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://github.com/${value}`} className="text-sm">
                    {value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "farcaster": {
              return (
                <div className="inline-flex items-center gap-2">
                  <SiFarcaster size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://warpcast.com/${value}`} className="text-sm">
                    @{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "telegram": {
              return (
                <div className="inline-flex items-center gap-2">
                  <SiTelegram size={16} className="text-gray-500" />
                  <ExternalLinkWithIcon href={`https://t.me/${value}`} className="text-sm">
                    @{value}
                  </ExternalLinkWithIcon>
                </div>
              );
            }
            case "linkedin": {
              return (
                <div className="inline-flex items-center gap-2">
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
            case "reddit": {
              return (
                <div className="inline-flex items-center gap-2">
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
}: { texts: Record<string, SocialLinkValue> }) {
  return <SocialLinks links={SOCIAL_LINK_KEYS.map((key) => ({ key, value: texts[key] }))} />;
};
