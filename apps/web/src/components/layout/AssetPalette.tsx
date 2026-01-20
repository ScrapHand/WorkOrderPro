"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { Asset } from '@/types/prisma-types'; // Assuming this exists or we use a local type

// Temporary type until we have the full shared types
interface AssetType {
    id: string;
    name: string;
    code: string;
    imageUrl?: string;
    status: string;
}

interface AssetPaletteProps {
    tenantSlug: string;
}

export function AssetPalette({ tenantSlug }: AssetPaletteProps) {
    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', tenantSlug],
        queryFn: async () => {
            const { data } = await axios.get<AssetType[]>('/api/v1/assets', {
                headers: { 'X-Tenant-Slug': tenantSlug }
            });
            return data;
        }
    });

    const onDragStart = (event: React.DragEvent, asset: AssetType) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(asset));
        event.dataTransfer.effectAllowed = 'move';
    };

    if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading Assets...</div>;

    return (
        <Card className="h-full w-64 border-r rounded-none bg-white flex flex-col z-10">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm mb-1">Asset Library</h3>
                <p className="text-xs text-muted-foreground">Drag to canvas</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                    {assets?.map((asset) => (
                        <div
                            key={asset.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 border rounded-md cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors shadow-sm"
                            onDragStart={(event) => onDragStart(event, asset)}
                            draggable
                        >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{asset.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{asset.code}</div>
                            </div>
                            {asset.imageUrl && (
                                <img src={asset.imageUrl} alt={asset.name} className="h-8 w-8 rounded object-cover bg-gray-200" />
                            )}
                        </div>
                    ))}
                    {assets?.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-8">
                            No assets found. Create assets in the Inventory first.
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
