import {SavedQuery} from "@/components/graphiql-editor";


interface ExampleQuery extends SavedQuery {
    description: string;
    icon: React.ReactNode;
}

//TODO: the whole text content will probably need adjustments
export default function ExampleQueriesPage() {
    return (
        <main className="h-full w-full">
            <header className="h-1/6 border-2 border-green-600">
                <h1>Explore use cases for GraphQL queries</h1>
                <p>Check out, execute and modify the example queries to discover the power of ENS</p>
            </header>
            <div className="h-1/2 border-2 border-red-600">
                List of example queries
                <div>
                    <span>Query icon</span>
                    <h1>Query name</h1>
                    <span>separator</span>
                    <p>query description</p>
                </div>
            </div>
            <div className="w-full h-1/3 border-2 border-blue-600">
                <button>Open in GraphiQL editor /icon/</button>
                <div>CODE EXAMPLE</div>
            </div>
        </main>
    );
}