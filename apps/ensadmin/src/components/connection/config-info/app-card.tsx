import { ExternalLink } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { InfoIcon } from "@/components/icons/InfoIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ConfigInfoItemProps {
  label: string;
  value: ReactNode;
  additionalInfo?: ReactNode;
}

export interface ConfigInfoFeatureProps {
  label: string;
  description: ReactNode;
  isActivated?: boolean;
  icon: ReactElement;
}

export interface ConfigInfoFeaturesProps {
  activated?: boolean;
  children: ReactNode;
}

export interface ConfigInfoAppCardProps {
  name?: string;
  icon?: ReactElement;
  version?: ReactElement;
  docsLink?: URL;
  children?: ReactNode;
}

const cardHeaderLayoutStyles =
  "flex flex-row flex-nowrap justify-between items-center max-sm:flex-col max-sm:justify-start max-sm:items-start max-sm:gap-2";
const baseCardTitleStyles = "flex items-center gap-2";
const cardContentStyles = "flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:px-3 max-sm:pb-3";
const featureActivationsWrapperStyles =
  "flex flex-row flex-nowrap justify-start items-center gap-2";

/**
 * ConfigInfoItem - Renders a single info item with label, value, and optional tooltip
 */
export function ConfigInfoItem({ label, value, additionalInfo }: ConfigInfoItemProps) {
  return (
    <div className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start">
      <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">
        {label}
        {additionalInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
            >
              {additionalInfo}
            </TooltipContent>
          </Tooltip>
        )}
      </p>
      {value}
    </div>
  );
}

/**
 * ConfigInfoFeature - Renders a single feature badge with tooltip
 */
export function ConfigInfoFeature({
  label,
  description,
  isActivated = true,
  icon,
}: ConfigInfoFeatureProps) {
  return (
    <div className="max-sm:w-full flex flex-row flex-nowrap justify-start max-sm:justify-between items-center gap-1">
      <div className={featureActivationsWrapperStyles}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex justify-start items-center py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black cursor-default whitespace-nowrap gap-1">
              {icon}
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
          >
            {description}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/**
 * ConfigInfoFeatures - Groups multiple features under "Activated" or "Deactivated" section
 */
export function ConfigInfoFeatures({ activated = true, children }: ConfigInfoFeaturesProps) {
  return (
    <CardContent className={cardContentStyles}>
      <div className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start">
        <p className="text-sm leading-6 font-semibold text-gray-500">
          {activated ? "Activated Features" : "Deactivated Features"}
        </p>
        <div className="w-full flex flex-row flex-wrap justify-start items-start gap-1 pt-1">
          {children}
        </div>
      </div>
    </CardContent>
  );
}

/**
 * ConfigInfoItems - Wrapper for grouping ConfigInfoItem components
 */
export function ConfigInfoItems({ children }: { children: ReactNode }) {
  return <CardContent className={cardContentStyles}>{children}</CardContent>;
}

export function ConfigInfoAppCard({
  name,
  icon,
  version,
  docsLink,
  children,
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
              {version}
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
      {children}
    </Card>
  );
}
