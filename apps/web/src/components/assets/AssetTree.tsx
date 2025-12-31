"use client";

import React, { useState } from "react";
import { Asset } from "@/types/asset";
import { ChevronRight, ChevronDown, Monitor, AlertTriangle, CheckCircle } from "lucide-react"; // Assuming lucide-react is available, else standard icons or text

interface AssetTreeProps {
    assets: Asset[];
    onSelect?: (asset: Asset) => void;
    selectedId?: string | null;
}

const CriticalityBadge = ({ level }: { level: string }) => {
    const colors = {
        A: "bg-red-100 text-red-800",
        B: "bg-yellow-100 text-yellow-800",
        C: "bg-blue-100 text-blue-800",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[level as keyof typeof colors] || "bg-gray-100"}`}>
            {level}
        </span>
    );
};

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'OPERATIONAL') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'DOWN') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Monitor className="w-4 h-4 text-gray-500" />;
};

const AssetNode = ({ asset, allAssets, depth = 0, onSelect, selectedId }: { asset: Asset; allAssets: Asset[]; depth?: number; onSelect?: (a: Asset) => void; selectedId?: string | null }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Find children from the flat list (or if nested)
    const children = allAssets.filter(a => a.parentId === asset.id);
    const hasChildren = children.length > 0;

    const handleSelect = (e: React.MouseEvent) => {
        // e.stopPropagation(); // Don't stop propagation if we want the row to be clickable? Actually we do want to prevent toggle if specific
        // Let's implement row click = select, chevron click = toggle
        if (onSelect) {
            e.stopPropagation();
            onSelect(asset);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const isSelected = selectedId === asset.id;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer border-l-2 ${depth > 0 ? 'ml-4' : ''} ${isSelected ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
                onClick={handleSelect}
            >
                <div className="w-4" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}>
                    {hasChildren && (isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
                </div>

                <StatusIcon status={asset.status} />

                <span className="font-medium text-sm text-gray-700">{asset.name}</span>

                <CriticalityBadge level={asset.criticality} />

                {asset.description && <span className="text-xs text-gray-400 truncate max-w-[200px]">- {asset.description}</span>}
            </div>

            {isOpen && hasChildren && (
                <div className="ml-2">
                    {children.map(child => (
                        <AssetNode
                            key={child.id}
                            asset={child}
                            allAssets={allAssets}
                            depth={depth + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const AssetTree = ({ assets, onSelect, selectedId }: AssetTreeProps) => {
    const allIds = new Set(assets.map(a => a.id));
    const roots = assets.filter(a => !a.parentId || !allIds.has(a.parentId));

    return (
        <div className="p-4 bg-white shadow rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Monitor className="w-5 h-5" /> Asset Hierarchy
            </h3>
            <div className="flex flex-col gap-1">
                {roots.map(root => (
                    <AssetNode
                        key={root.id}
                        asset={root}
                        allAssets={assets}
                        onSelect={onSelect}
                        selectedId={selectedId}
                    />
                ))}
                {roots.length === 0 && <p className="text-gray-500 italic">No assets found.</p>}
            </div>
        </div>
    );
};
