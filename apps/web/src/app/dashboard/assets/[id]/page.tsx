"use client";

import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssetTree } from "@/components/assets/AssetTree";

export default function AssetDetailsPage() {
    const params = useParams();
    const id = params?.id as string;

    const { data: tree, isLoading } = useQuery({
        queryKey: ["asset", id, "tree"],
        queryFn: () => AssetService.getTree(id),
        enabled: !!id
    });

    if (isLoading) return <Loader2 className="animate-spin" />;

    // The first item in the tree is the root (the asset itself)
    const asset = tree?.[0];

    if (!asset) {
        return <div className="p-8">Asset not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/assets">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${asset.status === 'OPERATIONAL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {asset.status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details Card */}
                <div className="border rounded-lg p-6 bg-white space-y-4 shadow-sm">
                    <h2 className="text-lg font-semibold">Details</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">ID</p>
                            <p className="font-mono">{asset.id}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Criticality</p>
                            <p>{asset.criticality || "N/A"}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-muted-foreground">Description</p>
                            <p>{asset.description || "No description provided."}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Created At</p>
                            <p>{new Date(asset.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Hierarchy Preview */}
                <div className="border rounded-lg p-6 bg-white shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Hierarchy</h2>
                    {/* Render the tree starting from this asset */}
                    <AssetTree assets={tree || []} />
                </div>
            </div>
        </div>
    );
}
