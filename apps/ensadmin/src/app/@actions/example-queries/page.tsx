"use client";

import {Button} from "@/components/ui/button";
import Link from "next/link";

//TODO: replace placeholder links with some actually useful stuff
export default function ActionsExampleQueries() {
    return (
        <div className="flex flex-row items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground mb-1">Learn more about writing Subgraph queries:</p>
            <Button asChild><Link href="/status" target="_blank" rel="noopener noreferrer">How to query
                subgraphs</Link></Button>
            <Button asChild><Link href="/status" target="_blank" rel="noopener noreferrer">Querying best practices</Link></Button>
</div>);
}