import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { renderMicroseconds } from "@/lib/time";
import { renderProtocolStep, renderTraceDuration } from "@/lib/tracing";
import {
  ATTR_PROTOCOL_STEP,
  ForwardResolutionProtocolStep,
  type ProtocolTrace,
  ReverseResolutionProtocolStep,
} from "@ensnode/ensnode-sdk";

const asPercentInDuration = (value: number, duration: number) =>
  `${((value / duration) * 100).toFixed(2)}%`;

export function TraceRenderer({ trace }: { trace: ProtocolTrace }) {
  const totalDuration = renderTraceDuration(trace);

  function renderSpan(parent: ProtocolTrace[number]) {
    const protocolStep = parent.attributes[ATTR_PROTOCOL_STEP] as
      | ForwardResolutionProtocolStep
      | ReverseResolutionProtocolStep;
    const { title, description } = renderProtocolStep(protocolStep);

    return (
      <div key={parent.id} className="flex flex-col gap-2 w-full">
        {/* render this span */}
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <div className="w-full flex flex-col justify-center bg-blue-100 border border-blue-300 rounded text-xs whitespace-nowrap py-1 px-2 flex-shrink-0 cursor-pointer">
              <span>
                {title}{" "}
                <span className="text-gray-400">({renderMicroseconds(parent.duration)})</span>
              </span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="flex flex-col gap-2 w-full max-w-sm" collisionPadding={16}>
            <h3 className="text-md font-medium">{title}</h3>
            <p className="text-sm">
              Duration: <span className="font-mono">{renderMicroseconds(parent.duration)}</span>
            </p>
            <p>{description}</p>
          </HoverCardContent>
        </HoverCard>

        {/* render its children */}
        {parent.children.length > 0 && (
          <div className="flex flex-col gap-2">
            {parent.children.map((child, i) => {
              const marginLeft = asPercentInDuration(
                child.timestamp - parent.timestamp,
                parent.duration,
              );
              let width = asPercentInDuration(child.duration, parent.duration);

              // sometimes with microsecond level timing, it occurs that the children would overflow the
              // parent, so we constrain it here for visual reasons, just making the child take up
              // the rest of the available space, after its starting timestamp
              if (child.timestamp + child.duration > parent.timestamp + parent.duration) {
                width = asPercentInDuration(parent.timestamp - child.timestamp, parent.duration);
              }

              return (
                <div key={child.id} style={{ marginLeft, width }}>
                  {renderSpan(child)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-hidden bg-muted p-4 rounded">
      {trace.map((span) => renderSpan(span))}
    </div>
  );
}
