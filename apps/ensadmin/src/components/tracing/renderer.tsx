import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { renderMicroseconds } from "@/lib/time";
import { getProtocolStepInfo } from "@/lib/tracing";
import {
  ATTR_PROTOCOL_NAME,
  ATTR_PROTOCOL_STEP,
  ATTR_PROTOCOL_STEP_RESULT,
  ForwardResolutionProtocolStep,
  ProtocolSpan,
  type ProtocolTrace,
  ReverseResolutionProtocolStep,
} from "@ensnode/ensnode-sdk";

const asPercentInDuration = (value: number, duration: number) =>
  `${((value / duration) * 100).toFixed(2)}%`;

const renderSpanAttributes = (span: ProtocolSpan) => {
  const { [ATTR_PROTOCOL_STEP]: step, [ATTR_PROTOCOL_NAME]: protocol, ...rest } = span.attributes;
  switch (step) {
    case ReverseResolutionProtocolStep.Operation:
      return `(${rest.address}, ${rest.chainId})`;
    case ForwardResolutionProtocolStep.Operation:
      return `(${rest.name}, ${rest.selection})`;
    default:
      return null;
  }
};

export function TraceRenderer({ trace }: { trace: ProtocolTrace }) {
  function renderSpan(parent: ProtocolTrace[number]) {
    const protocolStep = parent.attributes[ATTR_PROTOCOL_STEP] as
      | ForwardResolutionProtocolStep
      | ReverseResolutionProtocolStep;
    const { title, description } = getProtocolStepInfo(protocolStep);

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* render this span */}
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>
            <div className="w-full flex flex-col justify-center bg-blue-100 border border-blue-300 rounded py-1 px-2 flex-shrink-0 cursor-pointer relative">
              <span className="text-xs whitespace-nowrap">
                {title}{" "}
                <span className="text-gray-400">({renderMicroseconds(parent.duration)})</span>
                <span className="font-mono text-muted-foreground">
                  {renderSpanAttributes(parent)}
                </span>
              </span>

              {/* render its events */}
              {parent.events.map((event) => {
                const left = asPercentInDuration(event.time - parent.timestamp, parent.duration);

                const protocolStep = event.attributes[ATTR_PROTOCOL_STEP] as
                  | ForwardResolutionProtocolStep
                  | ReverseResolutionProtocolStep;

                const result = event.attributes[ATTR_PROTOCOL_STEP_RESULT] as string | boolean;

                const { title, description } = getProtocolStepInfo(protocolStep);

                return (
                  <HoverCard key={event.name} openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <div
                        className="w-2 z-10 rounded bg-gray-400 bg-opacity-20 text-xs whitespace-nowrap flex-shrink-0 cursor-pointer absolute top-0 bottom-0"
                        style={{ left: `calc(${left} - 0.25rem)` }}
                      />
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="bottom"
                      className="flex flex-col gap-2 w-full max-w-sm"
                      collisionPadding={16}
                    >
                      <h3 className="text-md font-medium">{title}</h3>
                      <p>
                        Result:{" "}
                        <span className="font-mono">
                          {typeof result === "boolean" ? (result ? "true" : "false") : result}
                        </span>
                      </p>
                      <p>{description}</p>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="top"
            className="flex flex-col gap-2 w-full max-w-sm"
            collisionPadding={16}
          >
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
    <div className="flex flex-col gap-4 rounded-lg">
      {/* for each root span */}
      {trace.map((span) => {
        return (
          <div
            key={span.id}
            className="p-2 bg-muted rounded-lg flex flex-col overflow-hidden gap-2"
          >
            {renderSpan(span)}
          </div>
        );
      })}
    </div>
  );
}
