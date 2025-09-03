import {ENSIndexerDependencyInfoProps} from "@/components/indexing-status/dependecy-info";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ENSNodeIcon} from "@/components/ensnode-icon";
import {ENSIndexerIcon} from "@/components/ensindexer-icon";
import {cn} from "@/lib/utils";
import {ENSRainbowIcon} from "@/components/ensrainbow-icon";
import {ReactElement} from "react";
import {ExternalLink} from "lucide-react";
import {ENSDbIcon} from "@/components/ensdb-icon";
import {ChainIcon} from "@/components/chains/ChainIcon";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {CopyButton} from "@/components/ui/copy-button";

export function FigmaBasedDependencyInfo({ ensIndexerConfig }: ENSIndexerDependencyInfoProps) {
    const baseCardTitleStyles = "flex items-center gap-2";
    const cardContentStyles = "flex flex-col gap-4"
    const copyIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <g clipPath="url(#clip0_899_10241)">
            <path
                d="M2.66536 10.6666C1.93203 10.6666 1.33203 10.0666 1.33203 9.33325V2.66659C1.33203 1.93325 1.93203 1.33325 2.66536 1.33325H9.33203C10.0654 1.33325 10.6654 1.93325 10.6654 2.66659M6.66536 5.33325H13.332C14.0684 5.33325 14.6654 5.93021 14.6654 6.66659V13.3333C14.6654 14.0696 14.0684 14.6666 13.332 14.6666H6.66536C5.92899 14.6666 5.33203 14.0696 5.33203 13.3333V6.66659C5.33203 5.93021 5.92899 5.33325 6.66536 5.33325Z"
                stroke="#737373" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
            <clipPath id="clip0_899_10241">
                <rect width="16" height="16" fill="white"/>
            </clipPath>
        </defs>
    </svg>

    return <Card className="w-full">
        <CardHeader className="pb-2 max-sm:p-3">
            <CardTitle className={cn(baseCardTitleStyles, "text-lg")}>
                <ENSNodeIcon width={28} height={28}/>
                <span>ENSNode</span>
            </CardTitle>
        </CardHeader>
        <CardContent className={cardContentStyles}>
            <div className="flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3">
                <div className="h-fit min-w-[255px] flex flex-col justify-start items-start">
                    <p className="text-sm leading-6 font-semibold text-gray-500">Connection</p>
                    <p className="flex flex-row flex-nowrap justify-start items-center gap-[2px] text-sm leading-6 font-normal text-black">{ensIndexerConfig.ensNodePublicUrl.href}<CopyButton
                        value={ensIndexerConfig.ensNodePublicUrl.href} icon={copyIcon}/></p>
                </div>
                <div className="h-fit min-w-[255px] flex flex-col justify-start items-start">
                    <p className="text-sm leading-6 font-semibold text-gray-500">Public URL</p>
                    <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.ensAdminUrl.href}</p>
                </div>
            </div>
            <div className={cn(cardContentStyles, "max-sm:gap-3")}>
                {/*ENSIndexer*/}
                <FigmaAppCard
                    name="ENSIndexer"
                    icon={<ENSIndexerIcon width={20} height={20}/>}
                    items={[
                        {
                            label: "Ponder",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.dependencyInfo.ponder}</p>
                        },
                        {
                            label: "Node.js",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.dependencyInfo.nodejs}</p>
                        },
                        {
                            label: "Namespace",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.namespace}</p>,
                            additionalInfo: "The ENS namespace that ENSNode operates in the context of."
                        },
                        {
                            label: "Indexed chains",
                            value: <div
                                className="flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-3 pt-1">{Array.from(ensIndexerConfig.indexedChainIds).map((chainId) =>
                                <ChainIcon chainId={chainId}/>)}</div>
                        },
                        {
                            label: "Active Plugins",
                            value: <div
                                className="w-full flex flex-row flex-nowrap max-sm:flex-wrap justify-start items-start gap-1 pt-1">{ensIndexerConfig.plugins.map((plugin) =>
                                <PluginBadge text={plugin}/>)}</div>
                        }
                    ]}
                    version={ensIndexerConfig.dependencyInfo.ensRainbow}
                    docsLink={new URL("https://ensnode.io/ensindexer/")}/>
                {/*The version of ensindexer is a stretch, idk if we can be sure that the versions are aligned, probably not */}
                {/*ENSRainbow*/}
                <FigmaAppCard
                    name="ENSRainbow"
                    icon={<ENSRainbowIcon width={20} height={20}/>}
                    items={[
                        {
                            label: "Schema Version",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.dependencyInfo.ensRainbowSchema}</p>
                        },
                        {
                            label: "LabelSetId",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.labelSet.labelSetId}</p>,
                            additionalInfo: "Optional label set ID that the ENSRainbow server is expected to use. If provided, heal operations will validate the ENSRainbow server is using this labelSetId."
                        },
                        {
                            label: "Highest label set version",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.labelSet.labelSetVersion}</p>,
                            additionalInfo: "Optional highest label set version of label set id to query. Enables deterministic heal results across time even if the ENSRainbow server ingests label sets with greater versions than this value. If provided, only labels from label sets with versions less than or equal to this value will be returned. If not provided, the server will use the latest available version."
                        }
                    ]}
                    version={ensIndexerConfig.dependencyInfo.ensRainbow}
                    docsLink={new URL("https://ensnode.io/ensrainbow/")}/>
                {/*ENSDb*/}
                <FigmaAppCard
                    name="ENSDb"
                    icon={<ENSDbIcon width={20} height={20}/>}
                    items={[
                        {
                            label: "Database Schema",
                            value: <p
                                className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.databaseSchemaName}</p>
                        }
                    ]}
                    version="ClosedAlpha"/>
            </div>
        </CardContent>
    </Card>
}

interface AppCardContent {
    label: string;
    value: ReactElement;
    additionalInfo?: string;
}

interface AppCardProps {
    name: string;
    icon: ReactElement;
    items: AppCardContent[];
    version: string;
    docsLink?: URL;
}

const FigmaAppCard = ({name, icon, items, version, docsLink}: AppCardProps) => {
    const cardHeaderLayoutStyles = "flex flex-row flex-nowrap justify-between items-center max-sm:flex-col max-sm:justify-start max-sm:items-start max-sm:gap-2";
    const baseCardTitleStyles = "flex items-center gap-2";
    const cardContentStyles = "flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3"

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className={cardHeaderLayoutStyles}>
                    <CardTitle className={cn(baseCardTitleStyles, "text-sm leading-6 font-bold")}>
                    {icon}
                    <span>{name}</span>
                </CardTitle>
                <div className={baseCardTitleStyles}>
                    <p className="text-sm leading-normal font-normal text-muted-foreground">v{version}</p>
                    {docsLink && <a href={docsLink.href} target="_blank" rel="noreferrer noopener"
                                    className="flex items-center gap-1 text-sm leading-normal text-blue-600 hover:underline font-normal">
                        View Docs <ExternalLink size={14} className="inline-block" /></a>}
                </div>
            </div>
        </CardHeader>
        <CardContent className={cardContentStyles}>
            {items.map((item) => <div key={`${name}-${item.label}-item`} className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start">
                <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">{item.label}{item.additionalInfo && <AdditionalInformationTooltip text={item.additionalInfo} />}</p>
                {item.value}
            </div>)}
        </CardContent>
    </Card>);
}

interface TextContentProps {
    text: string;
}


const PluginBadge = ({text}: TextContentProps) => <span className="flex justify-start items-start py-[2px] px-[10px] rounded-full bg-secondary text-sm leading-normal font-semibold text-black">{text}</span>;

const AdditionalInformationTooltip = ({text}: TextContentProps) => {
    const InfoIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none" className="cursor-pointer">
            <g clipPath="url(#clip0_876_7239)">
                <path
                    d="M8.2487 10.6666V7.99992M8.2487 5.33325H8.25536M14.9154 7.99992C14.9154 11.6818 11.9306 14.6666 8.2487 14.6666C4.5668 14.6666 1.58203 11.6818 1.58203 7.99992C1.58203 4.31802 4.5668 1.33325 8.2487 1.33325C11.9306 1.33325 14.9154 4.31802 14.9154 7.99992Z"
                    stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
                <clipPath id="clip0_876_7239">
                    <rect width="16" height="16" fill="white" transform="translate(0.25)"/>
                </clipPath>
            </defs>
        </svg>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild >
                {InfoIcon}
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-50 text-md text-sm text-black shadow-md outline-none">
                <p className="text-left w-fit max-w-[255px] p-2">
                    {text}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}

interface EvolutionAppCardProps extends AppCardProps {
    checks: {
        label: string;
        description: string;
        value: boolean;
    }
}

//TODO: make planned changes to this version of design:
// 1. Bigger app icons and names
// 2. Inclusion of the booleans from config (with icons prepared in Figma)
// 3. Anything else?
const FigmaEvolutionAppCard = ({name, icon, items, version, docsLink}: EvolutionAppCardProps) => {
    const cardHeaderLayoutStyles = "flex flex-row flex-nowrap justify-between items-center max-sm:flex-col max-sm:justify-start max-sm:items-start max-sm:gap-2";
    const baseCardTitleStyles = "flex items-center gap-2";
    const cardContentStyles = "flex flex-row flex-wrap gap-5 max-sm:flex-col max-sm:gap-3"

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className={cardHeaderLayoutStyles}>
                    <CardTitle className={cn(baseCardTitleStyles, "text-sm leading-6 font-bold")}>
                        {icon}
                        <span>{name}</span>
                    </CardTitle>
                    <div className={baseCardTitleStyles}>
                        <p className="text-sm leading-normal font-normal text-muted-foreground">v{version}</p>
                        {docsLink && <a href={docsLink.href} target="_blank" rel="noreferrer noopener"
                                        className="flex items-center gap-1 text-sm leading-normal text-blue-600 hover:underline font-normal">
                            View Docs <ExternalLink size={14} className="inline-block" /></a>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cardContentStyles}>
                {items.map((item) => <div key={`${name}-${item.label}-item`} className="h-fit sm:min-w-[255px] flex flex-col justify-start items-start">
                    <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-sm leading-6 font-semibold text-gray-500">{item.label}{item.additionalInfo && <AdditionalInformationTooltip text={item.additionalInfo} />}</p>
                    {item.value}
                </div>)}
            </CardContent>
        </Card>);
}