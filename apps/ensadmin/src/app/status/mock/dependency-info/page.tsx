"use client";

import {cn} from "@/lib/utils";
import {ENSIndexerDependencyInfo} from "@/components/indexing-status/dependecy-info";
import {MockENSIndexerPublicConfig} from "@/app/status/mock/dependency-info/data";
import {FigmaBasedDependencyInfo} from "@/app/status/mock/dependency-info/designs";

export default function StatusMockDependencyInfoPage() {
    const headerStyles = "font-semibold leading-normal text-black"

    return <section className="flex flex-col gap-6 p-6">
        <h1 className={cn(headerStyles, "text-xl")}>New "Dependency Info" design proposals</h1>
        {contentSeparator}

        <h1 className={cn(headerStyles, "text-lg")}>Current production version</h1>
        <ENSIndexerDependencyInfo ensIndexerConfig={MockENSIndexerPublicConfig}/>
        {contentSeparator}

        <h1 className={cn(headerStyles, "text-lg")}>Version strictly based on Figma</h1>
        <FigmaBasedDependencyInfo ensIndexerConfig={MockENSIndexerPublicConfig} />
        {contentSeparator}

        <h1 className={cn(headerStyles, "text-lg")}>Evolution of Figma-based design</h1>
        <p>TODO</p>
        {contentSeparator}
    </section>;
}

const contentSeparator = <span className="w-full self-stretch h-[1px] bg-gray-300"/>