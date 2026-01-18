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

export function AssetNode({ data, selected }: NodeProps<any>) {
    const { asset } = data;

    const getStatusStyles = () => {
        switch (asset.status) {
            case 'OPERATIONAL':
                return {
                    bg: 'bg-green-500',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    badgeBg: 'bg-green-100'
                };
            case 'DOWN':
                return {
                    bg: 'bg-red-500',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    badgeBg: 'bg-red-100'
                };
            case 'MAINTENANCE':
                return {
                    bg: 'bg-yellow-500',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    badgeBg: 'bg-yellow-100'
                };
            default:
                return {
                    bg: 'bg-gray-500',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    badgeBg: 'bg-gray-100'
                };
        }
    };

    const styles = getStatusStyles();

    return (
        <div
            className={`bg-white rounded-lg shadow-xl min-w-[180px] overflow-hidden transition-all ${selected ? 'ring-2 ring-blue-500 scale-105' : 'border border-gray-200'
                }`}
        >
            {/* Status Bar */}
            <div className={`h-1.5 w-full ${styles.bg}`} />

            {/* Top Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-gray-400 border-2 border-white"
            />

            {/* Card Content */}
            <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                            {asset.name}
                        </div>
                        {asset.code && (
                            <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                                {asset.code}
                            </div>
                        )}
                    </div>
                    {/* Status Dot */}
                    <div className={`h-2.5 w-2.5 rounded-full ${styles.bg} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                </div>

                {/* Image */}
                {asset.imageUrl && (
                    <div className="w-full h-24 bg-gray-50 rounded-md overflow-hidden border border-gray-100 group">
                        <img
                            src={asset.imageUrl}
                            alt={asset.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                    </div>
                )}

                {/* Status Badge */}
                <div className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-tighter ${styles.badgeBg} ${styles.text} ${styles.border}`}>
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
