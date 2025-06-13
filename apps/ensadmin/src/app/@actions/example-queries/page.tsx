import ExampleQueriesDocumentationLinks from "@/app/example-queries/components/ExampleQueriesDocumentationLinks";

//TODO: for the sake of responsiveness this elem was moved into the main panel for smaller widths (<1280px) but that might change if the panel's overall design changes
export default function ActionsExampleQueries() {
  return <ExampleQueriesDocumentationLinks styles="hidden xl:flex" />;
}
