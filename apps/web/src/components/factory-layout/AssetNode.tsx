import { Handle, Position, NodeProps } from '@xyflow/react';

interface AssetNodeData {
    asset: {
        id: string;
        name: string;
        code?: string;
        status: 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE';
        imageUrl?: string;
        description?: string;
    };
}

export function AssetNode({ data, selected }: NodeProps<AssetNodeData>) {
    const { asset } = data;

    const getStatusColor = () => {
        switch (asset.status) {
            case 'OPERATIONAL':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'DOWN':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'MAINTENANCE':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-md min-w-[180px] transition-all ${selected ? 'ring-2 ring-blue-500' : 'border-2 border-gray-300'
                }`}
        >
            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-blue-500"
            />

            {/* Card Content */}
            <div className="p-3 space-y-2">
                {/* Image */}
                {asset.imageUrl && (
                    <div className="w-full h-20 bg-gray-100 rounded overflow-hidden">
                        <img
                            src={asset.imageUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Name */}
                <div className="font-semibold text-gray-900 text-sm leading-tight">
                    {asset.name}
                </div>

                {/* Code */}
                {asset.code && (
                    <div className="text-xs text-gray-500 font-mono">
                        {asset.code}
                    </div>
                )}

                {/* Status Badge */}
                <div className={`text-xs px-2 py-1 rounded border font-medium inline-block ${getStatusColor()}`}>
                    {asset.status}
                </div>
            </div>

            {/* Bottom Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-blue-500"
            />

            {/* Side Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-blue-500"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-blue-500"
            />
        </div>
    );
}
