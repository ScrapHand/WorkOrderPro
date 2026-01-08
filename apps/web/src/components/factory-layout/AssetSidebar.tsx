"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Asset {
    id: string;
    name: string;
    code?: string;
    status: 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE';
    imageUrl?: string;
    description?: string;
}

interface AssetSidebarProps {
    onClose?: () => void;
    existingAssetIds: string[];
}

export function AssetSidebar({ onClose, existingAssetIds }: AssetSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: assets, isLoading } = useQuery<Asset[]>({
        queryKey: ['assets'],
        queryFn: async () => {
            const res = await fetch('/api/v1/assets', {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch assets');
            return res.json();
        },
    });

    const filteredAssets = assets?.filter((asset) => {
        const matchesSearch =
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const notOnCanvas = !existingAssetIds.includes(asset.id);
        return matchesSearch && notOnCanvas;
    });

    const onDragStart = (event: React.DragEvent, asset: Asset) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({
            type: 'assetNode',
            data: { asset }
        }));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="absolute left-4 top-20 bottom-4 w-80 bg-white border rounded-lg shadow-lg z-10 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Add Assets</h3>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Asset List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading assets...</div>
                    ) : filteredAssets && filteredAssets.length > 0 ? (
                        filteredAssets.map((asset) => (
                            <div
                                key={asset.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, asset)}
                                className="p-3 border rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {asset.imageUrl && (
                                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                            <img
                                                src={asset.imageUrl}
                                                alt={asset.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{asset.name}</div>
                                        {asset.code && (
                                            <div className="text-xs text-gray-500 font-mono">{asset.code}</div>
                                        )}
                                        <div
                                            className={`text-xs inline-block mt-1 px-2 py-0.5 rounded ${asset.status === 'OPERATIONAL'
                                                    ? 'bg-green-100 text-green-800'
                                                    : asset.status === 'DOWN'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {asset.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                            {searchTerm ? 'No assets found' : 'All assets are on the canvas'}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-gray-50 text-xs text-muted-foreground">
                Drag assets onto the canvas to add them to the layout
            </div>
        </div>
    );
}
