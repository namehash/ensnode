import {Button} from "@/components/ui/button";
import Link from "next/link";
import {cn} from "@/lib/utils";


interface ExampleQueriesDocumentationLinksProps {
    styles: string;
}

//TODO: replace placeholder links with some actually useful stuff
export default function ExampleQueriesDocumentationLinks(props: ExampleQueriesDocumentationLinksProps) {
    return (<div className={cn("flex flex-row items-center justify-center gap-4", props.styles)}>
        <p className="text-sm text-muted-foreground mb-1">
            Learn more about writing Subgraph queries:
        </p>
        <Button asChild>
            <Link href="/status" target="_blank" rel="noopener noreferrer">
                How to query subgraphs
            </Link>
        </Button>
        <Button asChild>
            <Link href="/status" target="_blank" rel="noopener noreferrer">
                Querying best practices
            </Link>
        </Button>
    </div>);
}