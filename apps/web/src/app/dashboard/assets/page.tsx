"use client";

import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { AssetTree } from "@/components/assets/AssetTree";
import { useState } from "react";
import { Search } from "lucide-react";

export default function AssetsPage() {
    const [rootId, setRootId] = useState("41a408f1-64b1-49a2-b7c1-9f6a458bff78"); // Default from verify_tree.ts
    const [inputVal, setInputVal] = useState(rootId);

    const { data: assets, isLoading, error } = useQuery({
        queryKey: ["assetTree", rootId],
        queryFn: () => AssetService.getTree(rootId),
        enabled: !!rootId,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setRootId(inputVal);
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Asset Management</h1>
            </header>

            {/* Search / Root Selector */}
            <div className="bg-white p-4 rounded-lg border shadow-sm max-w-md">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Enter Root Asset ID..."
                        className="flex-1 border rounded px-3 py-2 text-sm"
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                        <Search className="w-4 h-4" /> Load Tree
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                    Try ID: 41a408f1-64b1-49a2-b7c1-9f6a458bff78 (Site A)
                </p>
            </div>

            {/* Tree Vis */}
            {isLoading && <p>Loading hierarchy...</p>}
            {error && <p className="text-red-500">Error loading tree: {(error as any).message}</p>}

            {assets && (
                <div className="max-w-3xl">
                    <AssetTree assets={assets} />
                </div>
            )}
        </div>
    );
}
