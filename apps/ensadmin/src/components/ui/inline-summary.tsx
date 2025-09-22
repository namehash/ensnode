import type { ReactElement } from "react";

interface InlineSummaryProps {
  items: ReadonlyArray<InlineSummaryItemProps>;
}

//TODO: currently unused, can we delete it?
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
  const propValue = props.value?.toString() ?? "unknown";
  return (
    <li>
      <strong>{props.label}</strong> <pre className="inline-block">{propValue}</pre>
    </li>
  );
}
