import {ReactElement} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {cn} from "@/lib/utils";
import {CheckIcon, ExternalLink, X} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {InfoIcon} from "@/components/icons/InfoIcon";

interface ConfigInfoAppCardContent {
    label: string;
    value: ReactElement;
    additionalInfo?: ReactElement;
}

export interface ConfigInfoAppCardProps {
    name: string;
    icon: ReactElement;
    items: ConfigInfoAppCardContent[];
    version: string;
    docsLink?: URL;
    checks?: {
        label: string;
        description: {
            descWhenTrue: string;
            descWhenFalse: string;
        };
        value: boolean;
        icon: ReactElement;
    }[];
}

export function ConfigInfoAppCard ({
                               name,
                               icon,
                               items,
                               version,
                               docsLink,
                               checks,
                           }: ConfigInfoAppCardProps) {
    const cardHeaderLayoutStyles =
        "flex flex-row flex-nowrap justify-between items-center max-sm:flex-col max-sm:justify-start max-sm:items-start max-sm:gap-2";
    const baseCardTitleStyles = "flex items-center gap-2";
    const cardContentStyles = "flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3";

    return (
        <Card>
            <CardHeader className="pb-5">
                <div className={cardHeaderLayoutStyles}>
                    <CardTitle className={cn(baseCardTitleStyles, "text-lg leading-normal font-semibold")}>
                        {icon}
                        <span>{name}</span>
                    </CardTitle>
                    <div className={baseCardTitleStyles}>
                        <p className="text-sm leading-normal font-normal text-muted-foreground">v{version}</p>
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
                                    <TooltipTrigger asChild>{<InfoIcon className="flex-shrink-0"/>}</TooltipTrigger>
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
            {checks && (
                <CardContent className={cardContentStyles}>
                    <span className="w-full self-stretch h-[1px] bg-gray-300" />
                    <div className="flex flex-col justify-start items-start gap-2">
                        <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-md leading-normal font-semibold text-black">
                            Settings
                        </p>
                        {checks.map((check) => (
                            <div
                                key={`${name}-${check.label}-check`}
                                className="flex flex-row flex-nowrap justify-start items-center gap-2"
                            >
                                {check.icon}
                                <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">
                                    {check.label}
                                    <Tooltip>
                                        <TooltipTrigger asChild>{<InfoIcon className="flex-shrink-0"/>}</TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
                                        >
                                            {
                                                <p>
                                                    {check.value
                                                        ? check.description.descWhenTrue
                                                        : check.description.descWhenFalse}
                                                </p>
                                            }
                                        </TooltipContent>
                                    </Tooltip>
                                </p>
                                {check.value ? (
                                    <CheckIcon className="text-emerald-600 flex-shrink-0" />
                                ) : (
                                    <X className="text-red-600 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};