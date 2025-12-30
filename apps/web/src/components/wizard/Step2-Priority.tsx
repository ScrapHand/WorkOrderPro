"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Info, Siren } from "lucide-react";

interface Step2Props {
    onSelect: (priority: "low" | "medium" | "high" | "critical") => void;
    selectedPriority?: string;
}

const PRIORITIES = [
    {
        id: "low",
        label: "Low",
        description: "Routine maintenance or cosmetic issues.",
        color: "bg-green-500",
        hover: "hover:bg-green-600",
        icon: Info
    },
    {
        id: "medium",
        label: "Medium",
        description: "Affects efficiency but production continues.",
        color: "bg-yellow-500",
        hover: "hover:bg-yellow-600",
        icon: Clock
    },
    {
        id: "high",
        label: "High",
        description: "Production is impacted or safety concern.",
        color: "bg-orange-500",
        hover: "hover:bg-orange-600",
        icon: AlertTriangle
    },
    {
        id: "critical",
        label: "Critical",
        description: "Line down or immediate danger.",
        color: "bg-red-600",
        hover: "hover:bg-red-700",
        icon: Siren
    }
] as const;

export function Step2Priority({ onSelect, selectedPriority }: Step2Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRIORITIES.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPriority === p.id;

                return (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelect(p.id)}
                        className={cn(
                            "relative group flex items-start space-x-4 p-4 rounded-xl text-left transition-all border-2",
                            isSelected
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-muted-foreground/20"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm transition-transform group-hover:scale-110",
                            p.color
                        )}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">{p.label}</h3>
                            <p className="text-sm text-muted-foreground leading-snug">{p.description}</p>
                        </div>

                        {isSelected && (
                            <div className="absolute top-4 right-4 h-3 w-3 bg-primary rounded-full animate-pulse" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
