import {Handle, NodeProps} from '@xyflow/react';
import { cn } from "@/lib/utils";
import {NodeHandle} from "@/app/react-flow/schema-elements/nodes";

export default function ParallelogramNode({data} : NodeProps){
    const nodeHandles = data.handles as NodeHandle[];
    return (
        <div className={cn("-skew-x-[25deg] rounded bg-white border border-black p-[10px] h-10 flex flex-col justify-center items-center", data.style as string)}>
            {nodeHandles.map((handle, idx) => <Handle key={`${data.label}Handle#${idx}`} style={{left: `${handle.x}px`, top: `${handle.y}px`, transform: "skew(25deg)"}} type={handle.type!} position={handle.position!} id={handle.id!}/>)}
            <p className="skew-x-[25deg] w-fit text-center text-xs">{data.label as string}</p>
        </div>
    );
}