import type { ReactElement } from "react";

interface InlineSummaryProps {
  items: ReadonlyArray<InlineSummaryItemProps>;
}

export function InlineSummary(props: InlineSummaryProps) {
  return (
    <ul className="text-sm text-muted-foreground mt-1 flex flex-row flex-wrap gap-4">
      {props.items.map((item) => (
        <InlineSummaryItem key={item.label} label={item.label} value={item.value} />
      ))}
    </ul>
  );
}

interface InlineSummaryItemProps {
  label: string;
  value?: ReactElement | unknown;
}

function InlineSummaryItem(props: InlineSummaryItemProps) {
  return (
    <li>
      <strong>{props.label}</strong>{" "}
      <pre className="inline-block">{props.value != null ? props.value.toString() : "unknown"}</pre>
    </li>
  );
}
