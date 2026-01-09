"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    Building2,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be alphanumeric and lowercase"),
    plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]).default("PRO")
});

type RegisterValues = z.infer<typeof registerSchema>;

const STEPS = [
    { id: "account", title: "Account Details", icon: ShieldCheck },
    { id: "company", title: "Company Profile", icon: Building2 },
    { id: "plan", title: "Select Plan", icon: CreditCard }
];

export default function RegisterPage() {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema) as any,
        defaultValues: {
            email: "",
            password: "",
            companyName: "",
            slug: "",
            plan: "PRO"
        }
    });

    const companyName = watch("companyName");
    useEffect(() => {
        if (companyName) {
            const slug = companyName
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "");
            setValue("slug", slug);
        }
    }, [companyName, setValue]);

    const onSubmit: SubmitHandler<RegisterValues> = async (data) => {
        setIsLoading(true);
        try {
            const response = await api.post("/auth/register", data);
            toast.success("Account created successfully!");

            // Auto-redirect to the new tenant dashboard
            const tenantSlug = data.slug;
            setTimeout(() => {
                router.push(`/${tenantSlug}/dashboard`);
            }, 1000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const prevStep = () => setStep(s => Math.max(s - 0, 0));

    const currentPlan = watch("plan");

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
            <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full -z-10" />

            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="relative h-8 w-8">
                            <Image src="/branding/logo.png" alt="AxonVantage Logo" fill className="object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">AxonVantage</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Deploy Your Operational Intelligence</h1>
                    <p className="text-gray-500">Industry-grade maintenance management starts here.</p>
                </div>

                {/* Stepper */}
                <div className="flex justify-between max-w-md mx-auto relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10 -translate-y-1/2" />
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2 bg-[#0a0a0b]">
                            <div
                                className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${i === step ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' :
                                    i < step ? 'bg-white/5 border-white/10 text-green-500' : 'bg-white/5 border-white/10 text-gray-600'
                                    }`}
                            >
                                {i < step ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className={`h-5 w-5 ${i === step ? 'text-white' : 'text-gray-600'}`} />}
                            </div>
                            <span className={`text-[10px] uppercase tracking-widest font-bold ${i === step ? 'text-white' : 'text-gray-600'}`}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <Card className="bg-white/[0.03] border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="pt-8 px-8 min-h-[400px]">
                            <AnimatePresence mode="wait">
                                {step === 0 && (
                                    <motion.div
                                        key="step0"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-gray-400">Professional Email Address</Label>
                                            <Input
                                                id="email"
                                                placeholder="name@company.com"
                                                className="bg-white/5 border-white/10 h-12 text-white placeholder:text-gray-700 focus:border-blue-500 transition-colors"
                                                {...register("email")}
                                            />
                                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password text-gray-400">Secure Access Key (Password)</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Min. 8 characters"
                                                className="bg-white/5 border-white/10 h-12 text-white placeholder:text-gray-700 focus:border-blue-500 transition-colors"
                                                {...register("password")}
                                            />
                                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                        </div>
                                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex gap-4">
                                            <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
                                            <p className="text-xs text-blue-300 leading-relaxed">
                                                AxonVantage implements strict tenant isolation and end-to-end audit logging. Your account credentials are encrypted using industry-standard protocols.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName" className="text-gray-400">Legal Company Name</Label>
                                            <Input
                                                id="companyName"
                                                placeholder="e.g. Atlas Industrial Group"
                                                className="bg-white/5 border-white/10 h-12 text-white placeholder:text-gray-700 focus:border-blue-500 transition-colors"
                                                {...register("companyName")}
                                            />
                                            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="slug" className="text-gray-400">Workstation Portal ID (Tenant Slug)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="slug"
                                                    placeholder="atlas-industrial"
                                                    className="bg-white/5 border-white/10 h-12 pl-24 text-white placeholder:text-gray-700 focus:border-blue-500 transition-colors"
                                                    {...register("slug")}
                                                />
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 border-r border-white/10 pr-3">
                                                    axon.pro/
                                                </div>
                                                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 italic">This will be your unique access URL for all facility staff.</p>
                                            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { id: "STARTER", title: "Starter", desc: "Up to 5 Admins. Basic CMMS.", price: "$0" },
                                                { id: "PRO", title: "Pro Suite", desc: "Up to 25 Admins. Nano Banana Pro Integrated.", price: "$299" },
                                                { id: "ENTERPRISE", title: "Enterprise", desc: "Unlimited. Priority Support & Custom SSL.", price: "Quote" },
                                            ].map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setValue("plan", p.id as any)}
                                                    className={`flex items-center justify-between p-6 rounded-2xl border transition-all text-left group ${currentPlan === p.id ? 'bg-blue-600/10 border-blue-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            {p.title}
                                                            {currentPlan === p.id && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{p.desc}</div>
                                                    </div>
                                                    <div className="text-xl font-black italic text-white group-hover:text-blue-400 transition-colors">
                                                        {p.price}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>

                        <CardFooter className="bg-white/5 border-t border-white/5 p-6 flex justify-between items-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={step === 0}
                                className="text-gray-400 hover:text-white disabled:opacity-30"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>

                            {step < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold"
                                >
                                    Continuue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 font-bold shadow-lg shadow-blue-500/20"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Finalize Implementation
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest font-medium">
                    Secure Registration Session. Data encrypted via TLS 1.3
                </p>
            </div>
        </div>
    );
}
