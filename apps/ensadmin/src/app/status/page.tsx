import { FetchAndDisplayIndexingStatusPanel } from "@/components/indexing-status";

export default function Status() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <FetchAndDisplayIndexingStatusPanel title="Indexing Status" />
    </section>
  );
}
