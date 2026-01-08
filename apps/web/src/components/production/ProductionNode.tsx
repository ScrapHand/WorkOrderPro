"use client";
import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gauge, Settings, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Asset } from "@/types/asset";

interface ProductionNodeData {
    asset: Asset;
    isBottleneck?: boolean;
}

const ProductionNode = ({ data }: NodeProps<ProductionNodeData>) => {
    const { asset, isBottleneck } = data;

    const StatusIcon = () => {
        switch (asset.status) {
            case 'OPERATIONAL': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'DOWN': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'MAINTENANCE': return <Settings className="h-4 w-4 text-orange-500" />;
            default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
        }
    };

    const isMaintenanceDue = asset.status === 'MAINTENANCE' || ((asset as any).designOEE || 0) < 60;
    const health = asset.status === 'DOWN' ? 0 : asset.status === 'MAINTENANCE' ? 50 : 100;

    return (
        <div className="relative group">
            <Card className={`w-[240px] shadow-sm border-2 transition-all bg-white relative overflow-hidden ${isBottleneck ? 'border-red-500 shadow-red-100 animate-pulse' : 'border-slate-200 group-hover:border-primary'}`}>
                <Handle type="target" position={Position.Left} className="!bg-slate-400 w-2 h-6 rounded-none border-none" />

                <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <StatusIcon />
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[100px] uppercase">
                            {asset.code || 'NO-CODE'}
                        </span>
                    </div>
                    {isBottleneck && (
                        <Badge variant="destructive" className="h-4 text-[8px] animate-bounce px-1">
                            Bottleneck
                        </Badge>
                    )}
                </CardHeader>

                <CardContent className="p-3 pt-2">
                    <CardTitle className="text-sm font-bold truncate mb-1" title={asset.name}>
                        {asset.name}
                    </CardTitle>

                    {/* Machine Health Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                        <div
                            className={`h-full transition-all duration-500 ${health === 100 ? 'bg-green-500' : health === 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${health}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                {isMaintenanceDue && <AlertTriangle className="h-2 w-2 text-orange-500" />}
                                Speed
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                                <div className={`p-1 rounded bg-primary/10 ${asset.status === 'OPERATIONAL' ? 'animate-pulse' : ''}`}>
                                    <Gauge className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-xs font-mono font-bold">{(asset as any).maxSpeed || 0}</span>
                                <span className="text-[8px] text-muted-foreground">u/m</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">OEE</span>
                            <div className="flex items-center gap-1 mt-1">
                                <span className={`text-xs font-mono font-bold ${((asset as any).designOEE || 0) > 80 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {((asset as any).designOEE || 0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <Handle type="source" position={Position.Right} className="!bg-slate-400 w-2 h-6 rounded-none border-none" />
            </Card>
        </div>
    );
};

export default memo(ProductionNode);
