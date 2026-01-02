"use client";
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical, Settings, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Asset } from "@/types/asset";

// Define the data structure passed to the node
interface AssetNodeData {
    asset: Asset;
    onEdit?: (asset: Asset) => void;
    isCollapsed?: boolean;
    hasChildren?: boolean;
    onToggle?: () => void;
}

const AssetNode = ({ data }: NodeProps<AssetNodeData>) => {
    const { asset, isCollapsed, hasChildren, onToggle } = data;

    // Status Icon Helper
    const StatusIcon = () => {
        switch (asset.status) {
            case 'OPERATIONAL': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'DOWN': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'MAINTENANCE': return <Settings className="h-4 w-4 text-orange-500" />;
            default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
        }
    };

    return (
        <div className="relative">
            <Card className="w-[280px] shadow-lg border-2 hover:border-primary transition-colors bg-white z-10 relative">
                <Handle type="target" position={Position.Top} className="!bg-muted-foreground w-3 h-3" />

                <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <StatusIcon />
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {asset.criticality || 'N/A'}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-3 pt-2">
                    <CardTitle className="text-sm font-semibold truncate" title={asset.name}>
                        {asset.name}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                        {asset.description || "No description"}
                    </div>
                    {/* Collapsed Details - Removed Location as per Request */}
                </CardContent>

                <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground w-3 h-3" />
            </Card>

            {/* Collapse/Expand Toggle Button */}
            {hasChildren && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle?.();
                    }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full w-8 h-8 flex items-center justify-center border-2 border-gray-300 bg-white hover:bg-gray-50 shadow-md text-sm font-bold text-gray-700 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? "+" : "-"}
                </button>
            )}
        </div>
    );
};

export default memo(AssetNode);
