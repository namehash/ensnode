import { cn } from "@/lib/utils";
import { Handle, NodeProps } from "@xyflow/react";
import { NodeHandle } from "../schema-elements/nodes";

export default function MultipleHandlesNode({ data }: NodeProps) {
  const nodeHandles = data.handles as NodeHandle[];
  return (
    <div
      className={cn(
        "rounded bg-white border border-black p-[10px] h-12 flex flex-col justify-center items-center",
        data.style as string,
      )}
    >
      {nodeHandles.map((handle, idx) => (
        <Handle
          key={`${data.label}Handle#${idx}`}
          style={{ left: `${handle.x}px` }}
          type={handle.type!}
          position={handle.position!}
          id={handle.id!}
        />
      ))}
      <p className="w-fit text-center text-xs">{data.label as string}</p>
    </div>
  );
}
