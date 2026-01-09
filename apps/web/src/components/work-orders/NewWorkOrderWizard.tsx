"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, ChevronRight, ClipboardList, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workOrderSchema, type WorkOrderCreate } from "@/lib/schemas/work-order";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "sonner";

import { UploadService } from "@/services/upload.service";
import { UploadCloud, X, FileImage, Loader2, Search } from "lucide-react";

import { AssetService } from "@/services/asset.service";
import { AssetGroupBoard } from "@/components/assets/AssetGroupBoard";
import { useTerminology } from "@/hooks/use-terminology";

export function NewWorkOrderWizard() {
    const t = useTerminology();
    const [step, setStep] = useState(1);
    const queryClient = useQueryClient();
    const router = useRouter();
    const params = useParams();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showDescription, setShowDescription] = useState(false);

    // [NEW] File State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // [NEW] Asset Search State
    const [assetSearch, setAssetSearch] = useState("");

    const { data: assets, isLoading: isLoadingAssets } = useQuery({
        queryKey: ["assets", "list"],
        queryFn: () => AssetService.getAll(),
    });

    const form = useForm<WorkOrderCreate>({
        resolver: zodResolver(workOrderSchema),
        defaultValues: {
            priority: "MEDIUM",
        },
    });

    const { reset, handleSubmit, setValue, watch, register, formState: { errors } } = form;
    const formData = watch();

    const mutation = useMutation({
        mutationFn: async (data: WorkOrderCreate) => {
            const res = await api.post("/work-orders", data);
            return res.data;
        },
        onMutate: async (newWo) => {
            await queryClient.cancelQueries({ queryKey: ["work-orders"] });
            queryClient.setQueryData(["work-orders"], (old: any) => [...(old || []), { ...newWo, id: "temp-" + Date.now(), status: "OPEN" }]);
        },
        onSuccess: async (data) => {
            const tenantSlug = (params?.tenantSlug as string) || 'default';

            // [NEW] Upload Photos if any
            if (selectedFiles.length > 0 && data?.id) {
                setIsUploading(true);
                try {
                    toast.loading("Uploading photos...");
                    for (const file of selectedFiles) {
                        try {
                            const { url, key } = await UploadService.getPresignedUrl('work-orders', data.id, file);
                            await UploadService.uploadToS3(url, file);
                            await UploadService.confirmUpload({
                                entityType: 'work-orders',
                                entityId: data.id,
                                key,
                                fileName: file.name,
                                mimeType: file.type,
                                size: file.size
                            });
                        } catch (itemErr) {
                            console.error(`Failed to upload file ${file.name}:`, itemErr);
                        }
                    }
                    toast.dismiss();
                    toast.success("Work Order created and photos uploaded (if any)!");
                } catch (err) {
                    console.error("Critical Upload Error:", err);
                    toast.error("Work Order created, but photo upload system failed.");
                } finally {
                    setIsUploading(false);
                }
            } else {
                toast.success("Work Order created successfully");
            }

            // [CRITICAL] Ensure state is cleared
            reset();
            setStep(1);
            setShowDescription(false);
            setSelectedFiles([]);

            // [NAVIGATION] Redirect to the new WO or the list
            if (data?.id) {
                router.push(`/${tenantSlug}/dashboard/work-orders/${data.id}`);
            } else {
                router.push(`/${tenantSlug}/dashboard/work-orders`);
            }
        },
        onError: (err: any) => {
            console.error("Submission Error:", err);
            setSubmitError(err.response?.data?.error || "Failed to create work order. Please try again.");
        }
    });

    const onSubmit = (data: WorkOrderCreate) => {
        setSubmitError(null);
        mutation.mutate(data);
    };

    const nextStep = () => setStep((s) => s + 1);
    const prevStep = () => setStep((s) => s - 1);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-5xl mx-auto min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white p-4 border-b flex flex-col gap-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">New Work Order</h1>
                        <span className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-700 text-[10px] font-black uppercase px-2 py-0.5 rounded italic">
                            Nano Banana Pro™ Engine
                        </span>
                    </div>
                    <div className="text-sm font-medium text-gray-500">Step {step} of 4</div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                        className="bg-primary h-full"
                        initial={{ width: "25%" }}
                        animate={{ width: `${(step / 4) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                </div>
            </div>

            <main className="flex-1 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: SELECT ASSET */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Select Targeted Asset</h2>
                                    <p className="text-sm text-gray-500">Nano Banana Pro millisecond lookup enabled.</p>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${t.assets.toLowerCase()} by name or location...`}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={assetSearch}
                                        onChange={(e) => setAssetSearch(e.target.value)}
                                    />
                                </div>

                                {isLoadingAssets ? (
                                    <div className="text-center p-8 text-muted-foreground">Loading {t.assets.toLowerCase()}...</div>
                                ) : (
                                    <AssetGroupBoard
                                        mode="select"
                                        assets={assets || []}
                                        searchQuery={assetSearch}
                                        onSelect={(asset) => {
                                            setValue("assetId", asset.id);
                                            nextStep();
                                        }}
                                    />
                                )}
                            </motion.div>
                        )}

                        {/* STEP 2: PRIORITY */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <h2 className="text-2xl font-semibold text-gray-800">How urgent is it?</h2>
                                <div className="space-y-3">
                                    {[
                                        { id: "LOW", label: "Low", desc: "Can wait until next scheduled interval", color: "bg-blue-50 border-blue-200 text-blue-700" },
                                        { id: "MEDIUM", label: "Medium", desc: "Should be fixed within 3 days", color: "bg-green-50 border-green-200 text-green-700" },
                                        { id: "HIGH", label: "High", desc: "Affecting production, fix ASAP", color: "bg-orange-50 border-orange-200 text-orange-700" },
                                        { id: "CRITICAL", label: "Critical", desc: "Safety hazard or line down", color: "bg-red-50 border-red-200 text-red-700" },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                setValue("priority", p.id as any);
                                                nextStep();
                                            }}
                                            className={`w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${formData.priority === p.id ? `ring-2 ring-offset-1 ${p.color}` : "bg-white border-gray-200"}`}
                                        >
                                            <div className="font-bold text-lg capitalize">{p.label}</div>
                                            <div className="text-sm opacity-80">{p.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                <Button type="button" variant="ghost" className="w-full" onClick={prevStep}>Back</Button>
                            </motion.div>
                        )}

                        {/* STEP 3: DETAILS */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-gray-800">What's wrong?</h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Issue Title</label>
                                        <input
                                            {...register("title")}
                                            placeholder="e.g. Leaking oil from main seal"
                                            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg"
                                        />
                                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                                    </div>

                                    {!showDescription ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowDescription(true)}
                                            className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
                                        >
                                            <ClipboardList className="h-4 w-4" /> Add more details (optional)
                                        </button>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-medium text-gray-700">Description</label>
                                            <textarea
                                                {...register("description")}
                                                rows={4}
                                                placeholder="Describe what happened..."
                                                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            />
                                        </div>
                                    )}

                                    {/* [ENHANCED] Photo Upload UI */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <label className="text-sm font-medium text-gray-700 block">Photos (Optional)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedFiles.map((file, i) => (
                                                <div key={i} className="relative group">
                                                    <div className="h-16 w-16 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                                                        {file.type.startsWith('image/') ? (
                                                            <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <FileImage className="h-6 w-6 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(i)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            <label className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                                <UploadCloud className="h-5 w-5 text-gray-400 shadow-sm" />
                                                <span className="text-[9px] text-gray-500 mt-1 font-medium">Add Photo</span>
                                                <input type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*" />
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-gray-400">Photos will be uploaded after creation.</p>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <Button
                                        type="button"
                                        className="w-full h-12 text-lg rounded-xl"
                                        onClick={async () => {
                                            const isValid = await form.trigger("title");
                                            if (isValid) nextStep();
                                        }}
                                    >
                                        Review <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full" onClick={prevStep}>Back</Button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: SUMMARY */}
                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-gray-800">Summary</h2>

                                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                                    <div>
                                        <div className="text-sm text-gray-500">{t.asset}</div>
                                        <div className="font-medium text-lg">{assets?.find(a => a.id === formData.assetId)?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Problem</div>
                                        <div className="font-medium text-lg">{formData.title}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Priority</div>
                                        <div className="font-medium text-lg capitalize">{formData.priority}</div>
                                    </div>
                                    {selectedFiles.length > 0 && (
                                        <div className="pt-2 border-t">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                <FileImage className="h-4 w-4" />
                                                <span>{selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''} attached</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {submitError && (
                                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                                        {submitError}
                                    </div>
                                )}

                                <Button type="submit" size="lg" disabled={mutation.isPending || isUploading} className="w-full bg-green-600 hover:bg-green-700">
                                    {mutation.isPending || isUploading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            {isUploading ? "Uploading Photos..." : "Creating..."}
                                        </span>
                                    ) : "Create Work Order"}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={prevStep}>Back</Button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </form>
            </main>
        </div>
    );
}
