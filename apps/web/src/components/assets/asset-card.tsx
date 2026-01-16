"use client";

import { Asset } from "@/types/asset";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Lock, History, MoreVertical, Trash2, ClipboardList } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AssetCardProps {
    asset: Asset;
    onViewDocs?: (asset: Asset) => void;
    onViewLoto?: (asset: Asset) => void;
    onViewSpecs?: (asset: Asset) => void;
    onEdit?: (asset: Asset) => void;
    onDelete?: (id: string) => void;
}

export function AssetCard({ asset, onViewDocs, onViewLoto, onViewSpecs, onEdit, onDelete }: AssetCardProps) {
    const params = useParams();
    const tenantSlug = params.tenantSlug as string || 'default';
    const isCritical = asset.criticality === "A";

    return (
        <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 group relative overflow-hidden bg-white border-slate-200">
            <div className="relative aspect-video bg-slate-100 w-full overflow-hidden rounded-t-xl">
                {asset.imageUrl ? (
                    <img
                        src={(() => {
                            if (!asset.imageUrl) return "";
                            if (asset.imageUrl.includes('/api/v1/upload/proxy')) return `${asset.imageUrl}&tenant=${tenantSlug}`;
                            if (asset.imageUrl.includes('amazonaws.com')) {
                                try {
                                    const urlObj = new URL(asset.imageUrl);
                                    // Robust key extraction: Find 'tenants/'
                                    const path = urlObj.pathname;
                                    const match = path.match(/tenants\/.+/);
                                    if (!match) return asset.imageUrl;

                                    const key = match[0];
                                    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://work-order-pro-backend.onrender.com').replace(/\/api\/v1\/?$/, '');
                                    return `${apiBase}/api/v1/upload/proxy?key=${key}&tenant=${tenantSlug}`;
                                } catch (e) { return asset.imageUrl; }
                            }
                            return asset.imageUrl;
                        })()}
                        alt={asset.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 gap-2">
                        <FileText className="h-8 w-8 opacity-20" />
                        <span className="text-xs font-medium opacity-50">No Image</span>
                    </div>
                )}

                {/* [PREMIUM] Glassmorphism Status Badge */}
                <div className="absolute top-3 right-3">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20
                        ${asset.status === 'OPERATIONAL'
                            ? 'bg-green-500/90 text-white'
                            : asset.status === 'DOWN'
                                ? 'bg-red-500/90 text-white'
                                : 'bg-amber-500/90 text-white'}`}>
                        {asset.status}
                    </div>
                </div>

                {/* Criticality Indicator (if Critical) */}
                {isCritical && (
                    <div className="absolute top-3 left-3">
                        <div className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-red-600 bg-white/90 backdrop-blur shadow-sm border border-red-100 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Critical
                        </div>
                    </div>
                )}
            </div>

            <CardHeader className="p-4 pb-2 space-y-1">
                <CardTitle className="line-clamp-1 text-base font-semibold text-slate-800 group-hover:text-primary transition-colors">
                    {asset.name}
                </CardTitle>
                <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                    {asset.description || "No description provided"}
                </p>
            </CardHeader>

            <CardContent className="p-4 pt-1 pb-4">
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <History className="h-3 w-3" /> Updated {new Date(asset.updatedAt || Date.now()).toLocaleDateString()}
                </div>
            </CardContent>

            {(onViewDocs || onViewLoto || onViewSpecs || onEdit) && (
                <CardFooter className="p-3 pt-0 grid grid-cols-4 gap-2 bg-slate-50/50 border-t border-slate-100">
                    {onViewDocs && (
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] px-1 col-span-1 hover:bg-white hover:shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); onViewDocs(asset); }} title="Documents">
                            <FileText className="mr-1 h-3 w-3 text-slate-500" /> Docs
                        </Button>
                    )}
                    {onViewLoto && (
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] px-1 col-span-1 hover:bg-white hover:shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); onViewLoto(asset); }} title="Lockout/Tagout">
                            <Lock className="mr-1 h-3 w-3 text-slate-500" /> LOTO
                        </Button>
                    )}
                    {onViewSpecs && (
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] px-1 col-span-1 hover:bg-white hover:shadow-sm transition-all" onClick={(e) => { e.stopPropagation(); onViewSpecs(asset); }} title="Specifications">
                            <ClipboardList className="mr-1 h-3 w-3 text-slate-500" /> Specs
                        </Button>
                    )}

                    <div className="col-span-1 flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-white hover:shadow-sm" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <Link href={`/${tenantSlug}/dashboard/work-orders?assetId=${asset.id}`}>
                                    <DropdownMenuItem>
                                        <History className="mr-2 h-4 w-4" /> View History
                                    </DropdownMenuItem>
                                </Link>
                                {onEdit && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(asset); }}>
                                        <FileText className="mr-2 h-4 w-4" /> Edit Asset
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Decommission
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
