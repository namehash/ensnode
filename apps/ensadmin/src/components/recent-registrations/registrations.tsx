"use client";

import {useENSIndexerConfig, useIndexingStatus} from "@ensnode/ensnode-react";
import {RecentRegistrations} from "@/components/recent-registrations/components";

export function Registrations(){
    const ensIndexerConfigQuery = useENSIndexerConfig();
    const indexingStatusQuery = useIndexingStatus();

    if (ensIndexerConfigQuery.isError) {
        return <RecentRegistrations error={{
            title: "ENSIndexerConfig error",
            description: ensIndexerConfigQuery.error.message
        }
        } />
    }

    if (indexingStatusQuery.isError){
        return <RecentRegistrations error={{title: "IndexingStatus error", description: indexingStatusQuery.error.message}} />
    }

    if (!ensIndexerConfigQuery.isSuccess || !indexingStatusQuery.isSuccess){
        return <RecentRegistrations />
    }

    const ensIndexerConfig = ensIndexerConfigQuery.data;
    const indexingStatus = indexingStatusQuery.data;

    return <section className="flex flex-col gap-6 p-6">
        <RecentRegistrations ensIndexerConfig={ensIndexerConfig}
                             indexingStatus={indexingStatus}/>
    </section>;
}