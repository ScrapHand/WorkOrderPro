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
}

const AssetNode = ({ data }: NodeProps<AssetNodeData>) => {
    const { asset } = data;

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
        <Card className="w-[280px] shadow-lg border-2 hover:border-primary transition-colors bg-white">
            <Handle type="target" position={Position.Top} className="!bg-muted-foreground w-3 h-3" />

            <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <StatusIcon />
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                        {asset.criticality}
                    </Badge>
                </div>
                {/* Future: Action Menu */}
                <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer opacity-50 hover:opacity-100" />
            </CardHeader>

            <CardContent className="p-3 pt-2">
                <CardTitle className="text-sm font-semibold truncate" title={asset.name}>
                    {asset.name}
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                    {asset.description || "No description"}
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex justify-between">
                    <span>{asset.hierarchyPath}</span>
                    {asset.children && asset.children.length > 0 && (
                        <span>{asset.children.length} Children</span>
                    )}
                </div>
            </CardContent>

            <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground w-3 h-3" />
        </Card>
    );
};

export default memo(AssetNode);
