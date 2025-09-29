"use client";

import {useENSIndexerConfig} from "@ensnode/ensnode-react";
import {ENSNodeConfigInfo} from "@/components/connection/config-info";

//TODO: Would appreciate advice about the naming convention here,
// since @/app/connection/page.tsx already has a component named "Connection"
export default function ConnectionInfo(){
    //TODO: Sometime ago we talked about provider/context that would call useENSIndexerConfig & useIndexingStatus "globally"
    // and then allow all other components to use it. I assume we still want that long term but it exceeds the scope of this PR?
    const ensIndexerConfigQuery = useENSIndexerConfig();

    if (ensIndexerConfigQuery.isError) {
        return (
            <ENSNodeConfigInfo
                error={{
                    title: "ENSNodeConfigInfo Error",
                    description: ensIndexerConfigQuery.error.message,
                }}
            />
        );
    }

    if (!ensIndexerConfigQuery.isSuccess) {
        return (
            <section className="flex flex-col gap-6 p-6">
                <ENSNodeConfigInfo /> {/*display loading state*/}
            </section>
        );
    }

    const ensIndexerConfig = ensIndexerConfigQuery.data;

    return (
        <section className="flex flex-col gap-6 p-6">
            <ENSNodeConfigInfo ensIndexerConfig={ensIndexerConfig} />
        </section>
    );
}