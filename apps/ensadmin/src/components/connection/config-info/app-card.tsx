import { InfoIcon } from "@/components/icons/InfoIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { ReactElement } from "react";

interface ConfigInfoAppCardContent {
  label: string;
  value: ReactElement;
  additionalInfo?: ReactElement;
}

export interface ConfigInfoAppCardFeature {
  label: string;
  description: ReactElement;
  isActivated: boolean;
  icon: ReactElement;
}

export interface ConfigInfoAppCardProps {
  name?: string;
  icon?: ReactElement;
  items?: ConfigInfoAppCardContent[];
  version?: string | ReactElement;
  docsLink?: URL;
  features?: ConfigInfoAppCardFeature[];
}

const cardHeaderLayoutStyles =
  "flex flex-row flex-nowrap justify-between items-center max-sm:flex-col max-sm:justify-start max-sm:items-start max-sm:gap-2";
const baseCardTitleStyles = "flex items-center gap-2";
const cardContentStyles = "flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:px-3 max-sm:pb-3";
const featureActivationsWrapperStyles =
  "flex flex-row flex-nowrap justify-start items-center gap-2";

function FeaturesActivationList({
  features,
  isActivated,
}: {
  features: ConfigInfoAppCardFeature[] | undefined;
  isActivated: boolean;
}) {
  const relevantFeatures = features?.filter((feature) => feature.isActivated === isActivated) ?? [];

  return (
    relevantFeatures.length > 0 && (
      <CardContent className={cardContentStyles}>
        <div className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start">
          <p className="text-sm leading-6 font-semibold text-gray-500">
            {isActivated ? "Activated Features" : "Deactivated Features"}
          </p>
          <div className="w-full flex flex-row flex-nowrap max-[1100px]:flex-wrap justify-start items-start gap-1 pt-1">
            {relevantFeatures.map((feature) => (
              <div
                key={`${feature.label}-check`}
                className="max-sm:w-full flex flex-row flex-nowrap justify-start max-sm:justify-between items-center gap-1"
              >
                <div className={featureActivationsWrapperStyles}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        key={`${feature.label}-badge`}
                        className="flex justify-start items-center py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default whitespace-nowrap gap-1"
                      >
                        {feature.icon}
                        {feature.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
                    >
                      {feature.description}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    )
  );
}

export function ConfigInfoAppCard({
  name,
  icon,
  items = [],
  version,
  docsLink,
  features,
}: ConfigInfoAppCardProps) {
  return (
    <Card className="shadow-sm">
      {(docsLink || name || icon || version) && (
        <CardHeader className="pb-6 max-sm:p-3">
          <div className={cardHeaderLayoutStyles}>
            {name && (
              <CardTitle
                className={cn(baseCardTitleStyles, "text-xl leading-normal font-semibold")}
              >
                {icon}
                <span>{name}</span>
              </CardTitle>
            )}
            <div className={baseCardTitleStyles}>
              {version &&
                (typeof version === "string" ? (
                  <p className="text-sm leading-normal font-normal text-muted-foreground">
                    v{version}
                  </p>
                ) : (
                  version
                ))}
              {docsLink && (
                <a
                  href={docsLink.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-sm leading-normal text-blue-600 hover:underline font-normal"
                >
                  View Docs <ExternalLink size={14} className="inline-block" />
                </a>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      {items && items.length > 0 && (
        <CardContent className={cardContentStyles}>
          {items.map((item) => (
            <div
              key={`${name}-${item.label}-item`}
              className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start"
            >
              <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">
                {item.label}
                {item.additionalInfo && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {<InfoIcon className="flex-shrink-0" />}
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
                    >
                      {item.additionalInfo}
                    </TooltipContent>
                  </Tooltip>
                )}
              </p>
              {item.value}
            </div>
          ))}
        </CardContent>
      )}
      <FeaturesActivationList features={features} isActivated={true} />
      <FeaturesActivationList features={features} isActivated={false} />
    </Card>
  );
}
