"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, ChevronRight, ClipboardList, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workOrderSchema, type WorkOrderCreate } from "@/lib/schemas/work-order";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

// Mock Assets for MVP
const MOCK_ASSETS = [
    { id: "a1", name: "Hydraulic Press #1", status: "healthy" },
    { id: "a2", name: "Conveyor Belt A", status: "warning" },
    { id: "a3", name: "Forklift B", status: "breakdown" },
    { id: "a4", name: "Packaging Unit 5", status: "healthy" },
];

export default function CreateWorkOrderWizard() {
    const [step, setStep] = useState(1);
    const queryClient = useQueryClient();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showDescription, setShowDescription] = useState(false); // [UX] Optional Description

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
        onSuccess: () => {
            reset();
            setStep(1);
            alert("Work Order Created Successfully!");
            setShowDescription(false);
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
                                <div className="grid grid-cols-2 gap-4">
                                    {MOCK_ASSETS.map((asset) => (
                                        <button
                                            key={asset.id}
                                            type="button"
                                            onClick={() => {
                                                setValue("assetId", asset.id);
                                                nextStep();
                                            }}
                                            className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-200 transition-all text-left flex flex-col gap-2 h-32 justify-between"
                                        >
                                            <span className="font-bold text-lg text-gray-800">{asset.name}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full w-fit ${asset.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {asset.status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: ISSUE DETAILS */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-semibold text-gray-800">What's the problem?</h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Short Title</label>
                                    <input
                                        {...register("title")}
                                        placeholder="e.g. Leaking Oil"
                                        className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                    />
                                    {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                                </div>

                                {/* Optional Description Toggle */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">Detailed Description</label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 h-auto p-0 hover:bg-transparent"
                                            onClick={() => setShowDescription(!showDescription)}
                                        >
                                            {showDescription ? "- Remove" : "+ Add Optional"}
                                        </Button>
                                    </div>

                                    {showDescription && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <textarea
                                                {...register("description")}
                                                rows={5}
                                                placeholder="Describe what happened..."
                                                className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                            />
                                        </motion.div>
                                    )}
                                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                                </div>

                                <Button type="button" size="lg" className="w-full" onClick={nextStep}>
                                    Next <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={prevStep}>Back</Button>
                            </motion.div>
                        )}

                        {/* STEP 3: PRIORITY */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <h2 className="text-2xl font-semibold text-gray-800">How urgent is it?</h2>
                                <div className="grid gap-4">
                                    {["low", "medium", "high", "critical"].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                setValue("priority", p as any);
                                                nextStep();
                                            }}
                                            className={`p-6 rounded-xl border-2 text-left transition-all flex items-center gap-4
                        ${formData.priority === p ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}
                      `}
                                        >
                                            {p === 'critical' && <AlertTriangle className="text-red-500 w-6 h-6" />}
                                            {p === 'high' && <AlertCircle className="text-orange-500 w-6 h-6" />}
                                            {p === 'medium' && <ClipboardList className="text-yellow-500 w-6 h-6" />}
                                            {p === 'low' && <CheckCircle className="text-green-500 w-6 h-6" />}

                                            <span className="text-xl font-medium capitalize">{p} Priority</span>
                                        </button>
                                    ))}
                                </div>
                                <Button type="button" variant="ghost" className="w-full" onClick={prevStep}>Back</Button>
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
                                        <div className="font-medium text-lg">{MOCK_ASSETS.find(a => a.id === formData.assetId)?.name}</div>
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
