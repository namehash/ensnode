import EdgeLabel from "@/app/react-flow/custom-components/EdgeLabel";
import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import React, { type FC } from "react";

const CustomEdge: FC<
  EdgeProps<Edge<{ startLabel: string; endLabel: string; offsetY: number; offsetX: number }>>
> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: "black" }} />
      <EdgeLabelRenderer>
        {!data ||
          (data.startLabel && (
            <EdgeLabel
              transform={`translate(-50%, 0%) translate(${sourceX + (data.offsetX || 0)}px,${sourceY + (data.offsetY || 0)}px)`}
              label={data.startLabel}
            />
          ))}
        {!data ||
          (data.endLabel && (
            <EdgeLabel
              transform={`translate(-50%, -100%) translate(${targetX}px,${targetY}px)`}
              label={data.endLabel}
            />
          ))}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
