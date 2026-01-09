"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ASSET_TEMPLATES, AssetTemplate } from "@/constants/asset-templates";
import { Factory, Building, FlaskConical, ArrowRight, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { toast } from "sonner";

const ICON_MAP: Record<string, any> = {
    Factory,
    Building,
    FlaskConical
};

interface AssetTemplatePickerProps {
    onSuccess: () => void;
}

export function AssetTemplatePicker({ onSuccess }: AssetTemplatePickerProps) {
    const importMutation = useMutation({
        mutationFn: (template: AssetTemplate) => AssetService.importTemplate(template),
        onSuccess: () => {
            toast.success("Template imported successfully");
            onSuccess();
        },
        onError: (err: any) => {
            toast.error("Failed to import: " + (err.response?.data?.error || err.message));
        }
    });

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Start with a Blueprint</h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Choose a pre-configured asset hierarchy tailored to your industry.
                    This helps you define machine criticality (A, B, C) and structure your production lines correctly from day one.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {ASSET_TEMPLATES.map((template) => {
                    const Icon = ICON_MAP[template.icon] || Factory;
                    return (
                        <Card key={template.id} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <CardTitle>{template.name}</CardTitle>
                                <CardDescription className="min-h-[60px]">{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Example Structure</div>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        {template.structure.map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                                {item.name}
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold uppercase">
                                                    Crit {item.criticality}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button
                                    className="w-full group/btn"
                                    onClick={() => importMutation.mutate(template)}
                                    disabled={importMutation.isPending}
                                >
                                    {importMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            Use this Template
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-16 bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    Understanding Asset Criticality
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-red-50">
                        <div className="text-sm font-bold text-red-600 mb-1">A - CRITICAL</div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Business Stoppers. If this machine goes down, the entire line or plant stops. Zero redundancy.
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-50">
                        <div className="text-sm font-bold text-amber-600 mb-1">B - IMPORTANT</div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Production Slowdown. The plant keeps running, but efficiency drops significantly or quality is impacted.
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-sm font-bold text-gray-600 mb-1">C - ROUTINE</div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Convenience/Facility. Failures do not stop production (e.g., office HVAC, shop lights, standby pumps).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
