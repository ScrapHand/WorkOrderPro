"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Asset } from "@/types/asset";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface AssetSpecsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset | null;
    onSuccess?: () => void;
}

export function AssetSpecsModal({ open, onOpenChange, asset, onSuccess }: AssetSpecsModalProps) {
    const [specs, setSpecs] = useState<{ key: string, value: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (asset && asset.specs) {
            // Convert Object to Array for editing
            const entries = Object.entries(asset.specs).map(([key, value]) => ({ key, value }));
            setSpecs(entries);
        } else {
            setSpecs([]);
        }
    }, [asset]);

    const handleAddRow = () => {
        setSpecs([...specs, { key: "", value: "" }]);
    };

    const handleDeleteRow = (index: number) => {
        const newSpecs = [...specs];
        newSpecs.splice(index, 1);
        setSpecs(newSpecs);
    };

    const handleChange = (index: number, field: 'key' | 'value', val: string) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = val;
        setSpecs(newSpecs);
    };

    const handleSave = async () => {
        if (!asset) return;
        setIsSaving(true);
        try {
            // Convert Array back to Object
            const specsObj: Record<string, string> = {};
            specs.forEach(item => {
                if (item.key.trim()) {
                    specsObj[item.key.trim()] = item.value;
                }
            });

            await api.patch(`/assets/${asset.id}`, { specs: specsObj });
            toast.success("Specifications saved");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save specifications");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Asset Specifications: {asset?.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Add technical specifications, dimensions, or custom attributes.
                    </p>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {specs.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                                No specifications added yet.
                            </div>
                        )}

                        {specs.map((row, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input
                                    placeholder="Label (e.g. Voltage)"
                                    value={row.key}
                                    onChange={(e) => handleChange(index, 'key', e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Value (e.g. 220V)"
                                    value={row.value}
                                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteRow(index)}
                                    className="text-destructive hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button variant="outline" onClick={handleAddRow} className="w-full border-dashed gap-2">
                        <Plus className="h-4 w-4" /> Add Specification
                    </Button>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        <Save className="h-4 w-4" /> Save Specs
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
