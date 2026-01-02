import { useEffect } from 'react';
import { useReactFlow, Edge, Node, Position } from 'reactflow';
import dagre from 'dagre';

// Default node size for layout calculation
const NODE_WIDTH = 300;
const NODE_HEIGHT = 150;

export const useAutoLayout = (nodes: Node[], edges: Edge[]) => {
    const { setNodes, setEdges, fitView } = useReactFlow();

    useEffect(() => {
        if (!nodes.length) return;

        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        // Direction: 'TB' = Top to Bottom, 'LR' = Left to Right
        dagreGraph.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 });

        nodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);

            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - NODE_WIDTH / 2,
                    y: nodeWithPosition.y - NODE_HEIGHT / 2,
                },
                targetPosition: 'top' as Position,
                sourcePosition: 'bottom' as Position,
            };
        });

        setNodes(layoutedNodes);
        setEdges(edges);

        // Wait for render cycle then fit view
        window.requestAnimationFrame(() => {
            fitView({ padding: 0.2, duration: 800 });
        });

    }, [nodes.length, edges.length, setNodes, setEdges, fitView]);
};
