import {ENSIndexerDependencyInfoProps} from "@/components/indexing-status/dependecy-info";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ENSNodeIcon} from "@/components/ensnode-icon";
import {ENSIndexerIcon} from "@/components/ensindexer-icon";
import {cn} from "@/lib/utils";
import {ENSRainbowIcon} from "@/components/ensrainbow-icon";
import {ReactElement} from "react";
import {ExternalLink} from "lucide-react";

export function FigmaBasedDependencyInfo({ ensIndexerConfig }: ENSIndexerDependencyInfoProps) {
    const baseCardTitleStyles = "flex items-center gap-2";
    const cardContentStyles = "flex flex-col gap-4"
    return <Card className="w-full">
        <CardHeader className="pb-2">
            <CardTitle className={cn(baseCardTitleStyles, "text-lg")}>
                <ENSNodeIcon width={28} height={28} />
                <span>ENSNode</span>
            </CardTitle>
        </CardHeader>
        <CardContent className={cardContentStyles}>
            <div className="flex flex-row flex-wrap gap-5">
                <div className="h-fit min-w-[255px] flex flex-col justify-start items-start">
                    <p className="text-sm leading-6 font-semibold text-gray-500">Connection</p>
                    <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.ensNodePublicUrl.href}</p>
                    {/*TODO: copy icon & behavior*/}
                </div>
                <div className="h-fit min-w-[255px] flex flex-col justify-start items-start">
                    <p className="text-sm leading-6 font-semibold text-gray-500">Public URL</p>
                    <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.ensAdminUrl.href}</p>
                </div>
            </div>
            <div className={cardContentStyles}>
                {/*ENSIndexer*/}
                <AppCard
                    name="ENSIndexer"
                    icon={<ENSIndexerIcon width={20} height={20}/>}
                    items={[
                        {
                            label: "Ponder",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.dependencyInfo.ponder}</p>
                        },
                        {
                            label: "Node.js",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.dependencyInfo.nodejs}</p>
                        },
                        {
                            label: "Namespace",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.namespace}</p>,
                            additionalInfo: "Test test"
                        },
                        {
                            label: "Indexed chains",
                            value: <p className="text-sm leading-6 font-normal text-black">TODO: ICONS</p>
                        },
                        {
                            label: "Active Plugins",
                            value: <p className="text-sm leading-6 font-normal text-black">TODO: plugin pills</p>
                        }
                    ]}
                    version={ensIndexerConfig.dependencyInfo.ensRainbow}
                    docsLink={new URL("https://ensnode.io/ensindexer/")} />
                {/*The version of ensindexer is a stretch, idk if we can be sure that the versions are aligned, probably not */}
                {/*ENSRainbow*/}
                <AppCard
                    name="ENSRainbow"
                    icon={<ENSRainbowIcon width={20} height={20} />}
                    items={[
                        {
                            label: "Schema Version",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.dependencyInfo.ensRainbowSchema}</p>
                        },
                        {
                            label: "LabelSetId",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.labelSet.labelSetId}</p>,
                            additionalInfo: "Test test"
                        },
                        {
                            label: "Highest label set version",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.labelSet.labelSetVersion}</p>,
                            additionalInfo: "Test Test"
                        }
                    ]}
                    version={ensIndexerConfig.dependencyInfo.ensRainbow} docsLink={new URL("https://ensnode.io/ensrainbow/")} />
                {/*ENSDb*/}
                <AppCard
                    name="ENSDb"
                    icon={<ENSIndexerIcon width={20} height={20} />}
                    items={[
                        {
                            label: "Database Schema",
                            value: <p className="text-sm leading-6 font-normal text-black">{ensIndexerConfig.databaseSchemaName}</p>
                        }
                    ]}
                    version="ClosedAlpha" />
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

const AppCard = ({name, icon, items, version, docsLink}: AppCardProps) => {
    const cardHeaderLayoutStyles = "flex flex-row flex-nowrap justify-between items-center";
    const baseCardTitleStyles = "flex items-center gap-2";
    const cardContentStyles = "flex flex-row flex-wrap gap-5"

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
            {items.map((item) => <div key={`${name}-${item.label}-item`} className="h-fit min-w-[255px] flex flex-col justify-start items-start">
                <p className="text-sm leading-6 font-semibold text-gray-500">{item.label}</p>
                {/*TODO: additional infor tooltip*/}
                {item.value}
            </div>)}
        </CardContent>
    </Card>);
}