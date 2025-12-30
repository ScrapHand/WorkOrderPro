"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateWorkOrderSchema, CreateWorkOrderValues } from "@/lib/schemas/work-order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Step1AssetSelection } from "@/components/wizard/Step1-Asset";
import { Step2Priority } from "@/components/wizard/Step2-Priority";
import { Step3Details } from "@/components/wizard/Step3-Details";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CreateWorkOrderWizard() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const queryClient = useQueryClient();

    const methods = useForm<CreateWorkOrderValues>({
        resolver: zodResolver(CreateWorkOrderSchema),
        defaultValues: {
            priority: "medium",
            assignedToMe: true,
        },
        mode: "onChange"
    });

    const { handleSubmit, setValue, watch, trigger } = methods;
    const formData = watch();

    // Optimistic Mutation
    const mutation = useMutation({
        mutationFn: async (data: CreateWorkOrderValues) => {
            const payload = {
                asset_id: data.assetId,
                priority: data.priority,
                title: data.title,
                description: data.description,
                status: "new",
            }
            return api.post("/work-orders/", payload);
        },
        onSuccess: () => {
            // Invalidate list queries
            queryClient.invalidateQueries({ queryKey: ["work-orders"] });
            // Redirect or Show Success
            router.push("/dashboard");
        },
    });

    const nextStep = async () => {
        let isValid = false;
        if (step === 1) {
            if (formData.assetId) isValid = true;
            else methods.setError("assetId", { message: "Please select an asset" });
        } else if (step === 2) {
            isValid = await trigger("priority");
        }

        if (isValid) setStep((s) => s + 1);
    };

    const prevStep = () => setStep((s) => s - 1);

    const onSubmit = (data: CreateWorkOrderValues) => {
        mutation.mutate(data);
    };

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                    <span className={step >= 1 ? "text-primary" : ""}>Asset</span>
                    <span className={step >= 2 ? "text-primary" : ""}>Priority</span>
                    <span className={step >= 3 ? "text-primary" : ""}>Details</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="min-h-[400px] flex flex-col shadow-lg border-muted">
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {step === 1 && "What needs fixing?"}
                                {step === 2 && "How urgent is it?"}
                                {step === 3 && "Tell us more"}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1">
                            {step === 1 && (
                                <Step1AssetSelection
                                    onSelect={(id) => {
                                        setValue("assetId", id, { shouldValidate: true });
                                        // Auto advance for smoother UX
                                        // setStep(2); 
                                    }}
                                    selectedAssetId={formData.assetId}
                                />
                            )}
                            {step === 2 && (
                                <Step2Priority
                                    onSelect={(p) => setValue("priority", p)}
                                    selectedPriority={formData.priority}
                                />
                            )}
                            {step === 3 && <Step3Details />}
                        </CardContent>

                        <CardFooter className="flex justify-between border-t bg-muted/10 p-6">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={step === 1}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {step < 3 ? (
                                <Button type="button" onClick={nextStep} disabled={step === 1 && !formData.assetId}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={mutation.isPending} size="lg" className="w-full sm:w-auto">
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Work Order <CheckCircle2 className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </form>
            </FormProvider>
        </div>
    );
}
