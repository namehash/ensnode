import type { ProtocolTrace } from "@ensnode/ensnode-sdk";

const renderMilliseconds = (us: number) => (us / 1000).toFixed(2) + "ms";

export function TraceRenderer({ trace }: { trace: ProtocolTrace }) {
  function renderSpan(span: ProtocolTrace[number]) {
    return (
      <div key={span.id} className="flex flex-col gap-2 w-full">
        {/* render this span */}
        <div
          className="w-full flex flex-col justify-center bg-blue-100 border border-blue-300 rounded text-xs whitespace-nowrap overflow-ellipsis overflow-hidden py-1 px-2 flex-shrink-0"
          title={span.name}
        >
          <span>
            {span.name} <span className="text-gray-400">({renderMilliseconds(span.duration)})</span>
          </span>
        </div>

        {/* render its children */}
        {span.children.length > 0 && (
          <div className="flex flex-col gap-2">
            {span.children.map((child, i) => {
              const sibling = i > 0 ? span.children[i - 1] : undefined;
              const offsetUs = child.timestamp - span.timestamp; // - (sibling?.duration ?? 0);
              const startOffsetPercent = sibling?.duration ? (offsetUs / span.duration) * 100 : 0;
              const widthPercent = (child.duration / span.duration) * 100;

              return (
                <div
                  key={child.id}
                  style={{
                    marginLeft: `${startOffsetPercent.toFixed(4)}%`,
                    width: `${widthPercent.toFixed(4)}%`,
                  }}
                >
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
    <div className="flex flex-col gap-2 overflow-hidden">
      {trace.map((span) => renderSpan(span))}
    </div>
  );
}
