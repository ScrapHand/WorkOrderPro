"use client";

import { Asset } from "@/types/asset";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Lock, History, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";

interface AssetCardProps {
    asset: Asset;
    onViewDocs: (asset: Asset) => void;
    onViewLoto: (asset: Asset) => void;
    onViewSpecs: (asset: Asset) => void;
    onEdit?: (asset: Asset) => void;
    onDelete?: (id: string) => void;
}

export function AssetCard({ asset, onViewDocs, onViewLoto, onViewSpecs, onEdit, onDelete }: AssetCardProps) {
    const isCritical = asset.criticality === "A";

    return (
        <Card className="hover:shadow-md transition-shadow group">
            <div className="relative aspect-video bg-muted w-full overflow-hidden rounded-t-xl">
                {asset.imageUrl ? (
                    <img
                        src={(() => {
                            if (!asset.imageUrl) return "";
                            if (asset.imageUrl.includes('/api/v1/upload/proxy')) return `${asset.imageUrl}&tenant=default`; // Append tenant if already proxy
                            if (asset.imageUrl.includes('amazonaws.com')) {
                                try {
                                    const urlObj = new URL(asset.imageUrl);
                                    const key = urlObj.pathname.substring(1);
                                    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://work-order-pro-backend.onrender.com').replace(/\/api\/v1\/?$/, '');
                                    return `${apiBase}/api/v1/upload/proxy?key=${key}&tenant=default`;
                                } catch (e) { return asset.imageUrl; }
                            }
                            return asset.imageUrl;
                        })()}
                        alt={asset.name}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-gray-100">
                        No Image
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge variant={asset.status === 'OPERATIONAL' ? 'default' : 'destructive'}
                        className={asset.status === 'OPERATIONAL' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {asset.status}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="line-clamp-1 text-lg">{asset.name}</CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-1">{asset.description || "No description provided"}</p>
                    </div>
                    {isCritical && (
                        <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">
                            CRITICAL
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
                {/* Cleaned up Location info as requested */}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewDocs(asset)}>
                    <FileText className="mr-2 h-3 w-3" /> Docs
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewLoto(asset)}>
                    <Lock className="mr-2 h-3 w-3" /> LOTO
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onViewSpecs(asset)}>
                    <FileText className="mr-2 h-3 w-3" /> Specs
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <Link href={`/dashboard/work-orders?assetId=${asset.id}`}>
                            <DropdownMenuItem>
                                <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                        </Link>
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(asset)}>
                                <FileText className="mr-2 h-4 w-4" /> Edit Asset
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(asset.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Decommission
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}
