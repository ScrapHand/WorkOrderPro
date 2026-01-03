"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { AssetGroupBoard } from "@/components/assets/AssetGroupBoard";
import { Asset } from "@/types/asset";
import { CreateWorkOrderDTO, WorkOrderPriority } from "@/types/work-order";
import { CheckCircle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/common/FileUploader";

export function NewWorkOrderWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [createdWorkOrderId, setCreatedWorkOrderId] = useState<string | null>(null);
    const [rootId, setRootId] = useState("hq-001"); // Default for demo (Matches Seed)
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "LOW" as WorkOrderPriority
    });

    const { data: tree, isLoading: treeLoading } = useQuery({
        queryKey: ["assets"], // Changed key to generic assets
        queryFn: () => AssetService.getAll(),
    });

    const mutation = useMutation({
        mutationFn: AssetService.createWorkOrder,
        onSuccess: (data) => {
            setCreatedWorkOrderId(data.id);
            setStep(3); // Move to upload/success step
        },
        onError: (err: any) => {
            alert(`Error: ${err.message}`);
        }
    });


    const isStep1Valid = !!selectedAsset;
    const isStep2Valid = !!formData.title;

    const handleSubmit = () => {
        if (!selectedAsset) return;
        mutation.mutate({
            assetId: selectedAsset.id,
            title: formData.title,
            description: formData.description,
            priority: formData.priority
        });
    };

    return (
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">New Work Order - Step {step} of 2</h2>

            {/* STEP 1: ASSET SELECTION */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">
                            Select an asset from the board below. You can drag the background to scroll.
                        </div>
                    </div>

                    {treeLoading ? <Loader2 className="animate-spin" /> : tree ? (
                        <div className="border rounded h-96 overflow-hidden bg-gray-50/50">
                            {/* Use AssetGroupBoard in Select Mode */}
                            {/* Note: 'tree' variable here currently holds whatever getTree returns.
                                 If getTree returns nested, board needs flat. 
                                 AssetService.getTree actually returns flat array from backend recursive query? 
                                 Let's check. Yes, findSubtree returns flat array. 
                                 But for Board we might want ALL assets, not just a subtree of a hardcoded root.
                                 Let's switch query to getAll for maximum flexibility if rootId isn't critical.
                             */}
                            <AssetGroupBoard
                                assets={tree}
                                mode="select"
                                onSelect={(asset) => {
                                    setSelectedAsset(asset);
                                    setStep(2); // Auto-advance on select
                                }}
                            />
                        </div>
                    ) : <p>Load a tree to select an asset.</p>}
                </div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded border">
                        <p className="text-sm text-gray-500">Selected Asset</p>
                        <p className="font-semibold">{selectedAsset?.name}</p>
                        <p className="text-xs text-gray-400">Path: {selectedAsset?.hierarchyPath}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input
                            className="border p-2 rounded w-full mt-1"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Priority</label>
                        <select
                            className="border p-2 rounded w-full mt-1"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as WorkOrderPriority })}
                        >
                            <option value="LOW">Low (1)</option>
                            <option value="MEDIUM">Medium (4)</option>
                            <option value="HIGH">High (7)</option>
                            <option value="CRITICAL">Critical (10)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                            className="border p-2 rounded w-full mt-1"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-between mt-6">
                        <button onClick={() => setStep(1)} className="text-gray-600 px-4 py-2">Back</button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isStep2Valid || mutation.isPending}
                            className="bg-green-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {mutation.isPending && <Loader2 className="animate-spin w-4 h-4" />}
                            Create Work Order (Auto-Calculate RIME)
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: SUCCESS & UPLOAD */}
            {step === 3 && createdWorkOrderId && (
                <div className="space-y-6 text-center">
                    <div className="flex flex-col items-center text-green-600">
                        <CheckCircle className="w-16 h-16 mb-2" />
                        <h3 className="text-xl font-bold">Work Order Created!</h3>
                        <p className="text-gray-500">ID: {createdWorkOrderId}</p>
                    </div>

                    <div className="max-w-md mx-auto text-left space-y-2">
                        <label className="text-sm font-medium">Attach Documents/Images (Optional)</label>
                        <FileUploader
                            entityType="work-orders"
                            entityId={createdWorkOrderId}
                            onUploadComplete={() => alert("File Attached!")}
                        />
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => router.push('/dashboard/work-orders')}
                            className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


