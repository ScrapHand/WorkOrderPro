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

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { UserService } from "@/services/user.service";
import { AssetGroupBoard } from "@/components/assets/AssetGroupBoard";
import { Asset } from "@/types/asset";
import { CreateWorkOrderDTO, WorkOrderPriority } from "@/types/work-order";
import { CheckCircle, AlertTriangle, ArrowRight, Loader2, Gauge, HardHat, Zap, AlertOctagon, User as UserIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FileUploader } from "@/components/common/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NewWorkOrderWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [createdWorkOrderId, setCreatedWorkOrderId] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Form Data
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<WorkOrderPriority | null>(null);
    const [assignedUserId, setAssignedUserId] = useState<string | "">("");

    const { data: tree, isLoading: treeLoading } = useQuery({
        queryKey: ["assets"],
        queryFn: () => AssetService.getAll(),
    });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["users"],
        queryFn: () => UserService.getAll(),
    });

    const mutation = useMutation({
        mutationFn: AssetService.createWorkOrder,
        onSuccess: (data) => {
            setCreatedWorkOrderId(data.id);
            setStep(4); // Move to upload/success step
        },
        onError: (err: any) => {
            alert(`Error: ${err.message}`);
        }
    });

    const handleSubmit = () => {
        if (!selectedAsset || !priority || !title) return;
        mutation.mutate({
            assetId: selectedAsset.id,
            title,
            description,
            priority,
            // @ts-ignore - DTO needs update or backend handles it
            assignedUserId: assignedUserId || undefined
        });
    };

    const templates = [
        "Bearing Overheating: Detected high temperature during inspection.",
        "Leaking Seal: Oil leak observed at the main shaft seal.",
        "Motor Noise: Unusual grinding noise from the drive motor.",
        "Routine Inspection: 500-hour preventive maintenance check."
    ];

    const priorities: { id: WorkOrderPriority, label: string, score: string, icon: any, color: string }[] = [
        { id: "LOW", label: "Low Priority", score: "RIME: ~1-10", icon: Gauge, color: "bg-blue-100 text-blue-700 border-blue-200" },
        { id: "MEDIUM", label: "Medium", score: "RIME: ~20-40", icon: HardHat, color: "bg-green-100 text-green-700 border-green-200" },
        { id: "HIGH", label: "High Priority", score: "RIME: ~50-70", icon: Zap, color: "bg-orange-100 text-orange-700 border-orange-200" },
        { id: "CRITICAL", label: "Critical / Emergency", score: "RIME: >80", icon: AlertOctagon, color: "bg-red-100 text-red-700 border-red-200" },
    ];

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
            {/* Progress Bar */}
            <div className="bg-gray-50 border-b p-6 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">New Work Order</h2>
                    <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <div className="p-8 min-h-[500px]">
                {/* STEP 1: ASSET SELECTION */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-lg font-semibold mb-2">1. Select an Asset</h3>
                        {treeLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div> : tree ? (
                            <div className="border rounded-xl h-[500px] overflow-hidden bg-gray-50/50 shadow-inner">
                                <AssetGroupBoard
                                    assets={tree}
                                    mode="select"
                                    onSelect={(asset) => {
                                        setSelectedAsset(asset);
                                        setStep(2); // Auto-advance
                                    }}
                                />
                            </div>
                        ) : <p className="text-center text-gray-500">No assets found.</p>}
                    </div>
                )}

                {/* STEP 2: PRIORITY SELECTION */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">2. Select Priority</h3>
                            {selectedAsset && <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Asset: {selectedAsset.name}</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {priorities.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setPriority(p.id);
                                        setStep(3);
                                    }}
                                    className={`relative flex items-start gap-4 p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]
                                        ${priority === p.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30 bg-white shadow-sm'}`}
                                >
                                    <div className={`p-3 rounded-lg ${p.color}`}>
                                        <p.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{p.label}</div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{p.score}</div>
                                    </div>
                                    {priority === p.id && <div className="absolute top-4 right-4 text-primary"><CheckCircle className="w-5 h-5" /></div>}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t mt-8">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: DETAILS */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">3. Job Details</h3>
                            <div className="flex gap-2 text-xs font-medium text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded">{selectedAsset?.name}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">{priority}</span>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Work Order Title</Label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="e.g. Broken Conveyor Belt"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label>Assigned Technician</Label>
                                    <span className="text-xs text-muted-foreground">Optional</span>
                                </div>
                                <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a technician..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {users?.map(u => (
                                            <SelectItem key={u.id} value={u.id}>
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-3 h-3 text-gray-400" />
                                                    <span>{u.username || u.email}</span>
                                                    <span className="text-xs text-gray-400">({u.role})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label>Description</Label>
                                    <div className="flex gap-1">
                                        {/* AI / Template Badges */}
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wide mr-2">
                                            <Sparkles className="w-3 h-3 text-purple-500" /> Templates:
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-2">
                                    {templates.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setDescription(t)}
                                            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 hover:bg-purple-100 transition-colors"
                                        >
                                            {t.slice(0, 20)}...
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    rows={4}
                                    placeholder="Describe the issue..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-8 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!title || mutation.isPending}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[150px]"
                            >
                                {mutation.isPending && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                                Create Work Order
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS & UPLOAD */}
                {step === 4 && createdWorkOrderId && (
                    <div className="space-y-6 text-center py-8 animate-in zoom-in-50 duration-300">
                        <div className="flex flex-col items-center text-green-600">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Work Order Created!</h3>
                            <p className="text-gray-500">ID: {createdWorkOrderId}</p>
                        </div>

                        <div className="max-w-md mx-auto text-left space-y-4 bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                            <Label>Attach Documents / Images (Optional)</Label>
                            <FileUploader
                                entityType="work-orders"
                                entityId={createdWorkOrderId}
                                onUploadComplete={() => alert("File Attached!")}
                            />
                        </div>

                        <div className="pt-6">
                            <Button
                                onClick={() => router.push('/dashboard/work-orders')}
                                size="lg"
                                className="w-full max-w-xs"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


