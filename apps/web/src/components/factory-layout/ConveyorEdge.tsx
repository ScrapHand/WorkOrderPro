import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

interface ConveyorEdgeData {
    systemColor?: string;
    label?: string;
    type: 'CONVEYOR' | 'MODULE';
}

export function ConveyorEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
}: EdgeProps<ConveyorEdgeData>) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isConveyor = data?.type === 'CONVEYOR';
    const color = data?.systemColor || (isConveyor ? '#6366f1' : '#9ca3af');

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: color,
                    strokeWidth: isConveyor ? 4 : 2,
                    strokeDasharray: isConveyor ? undefined : '5,5',
                }}
            />
            {data?.label && (
                <text
                    x={labelX}
                    y={labelY}
                    className="text-xs fill-gray-700"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                        background: 'white',
                        padding: '2px 4px',
                    }}
                >
                    {data.label}
                </text>
            )}
        </>
    );
}
