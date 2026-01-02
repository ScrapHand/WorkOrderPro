"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, ChevronRight, ClipboardList, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workOrderSchema, type WorkOrderCreate } from "@/lib/schemas/work-order";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

import { AssetService } from "@/services/asset.service";

export default function CreateWorkOrderWizard() {
    const [step, setStep] = useState(1);
    const queryClient = useQueryClient();
    const router = useRouter();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showDescription, setShowDescription] = useState(false); // [UX] Optional Description

    const { data: assets, isLoading: isLoadingAssets } = useQuery({
        queryKey: ["assets", "list"],
        queryFn: () => AssetService.getAll(),
    });

    const form = useForm<WorkOrderCreate>({
        resolver: zodResolver(workOrderSchema),
        defaultValues: {
            priority: "medium",
        },
    });

    const { reset, handleSubmit, setValue, watch, register, formState: { errors } } = form;
    const formData = watch();

    const mutation = useMutation({
        mutationFn: async (data: WorkOrderCreate) => {
            // [FIX] Use API Client for Headers/Proxy/Auth
            const res = await api.post("/work-orders", data);
            return res.data;
        },
        onMutate: async (newWo) => {
            await queryClient.cancelQueries({ queryKey: ["work-orders"] });
            // Optimistic update
            queryClient.setQueryData(["work-orders"], (old: any) => [...(old || []), { ...newWo, id: "temp-" + Date.now(), status: "OPEN" }]);
        },
        onSuccess: (data) => {
            reset();
            setStep(1);
            setShowDescription(false);
            if (data?.id) {
                router.push(`/dashboard/work-orders/${data.id}`);
            } else {
                router.push("/dashboard/work-orders");
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

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-900">New Work Order</h1>
                <div className="text-sm text-gray-500">Step {step} of 4</div>
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
                                <h2 className="text-2xl font-semibold text-gray-800">Which asset is broken?</h2>
                                {isLoadingAssets ? (
                                    <div className="text-center p-8 text-muted-foreground">Loading assets...</div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {assets?.map((asset) => (
                                            <button
                                                key={asset.id}
                                                type="button"
                                                onClick={() => {
                                                    setValue("assetId", asset.id);
                                                    nextStep();
                                                }}
                                                className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-200 transition-all text-left flex flex-col gap-2 h-32 justify-between"
                                            >
                                                <span className="font-bold text-lg text-gray-800 line-clamp-2">{asset.name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {asset.hierarchyPath || "Main Floor"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
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
                                        { id: "low", label: "Low", desc: "Can wait until next scheduled interval", color: "bg-blue-50 border-blue-200 text-blue-700" },
                                        { id: "medium", label: "Medium", desc: "Should be fixed within 3 days", color: "bg-green-50 border-green-200 text-green-700" },
                                        { id: "high", label: "High", desc: "Affecting production, fix ASAP", color: "bg-orange-50 border-orange-200 text-orange-700" },
                                        { id: "critical", label: "Critical", desc: "Safety hazard or line down", color: "bg-red-50 border-red-200 text-red-700" },
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
                                        <div className="text-sm text-gray-500">Asset</div>
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
                                </div>

                                {submitError && (
                                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                                        {submitError}
                                    </div>
                                )}

                                <Button type="submit" size="lg" disabled={mutation.isPending} className="w-full bg-green-600 hover:bg-green-700">
                                    {mutation.isPending ? "Creating..." : "Create Work Order"}
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
