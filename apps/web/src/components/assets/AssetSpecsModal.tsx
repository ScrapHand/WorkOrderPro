"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Asset } from "@/types/asset";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
            // Convert Object to Array for editing, sorting keys for consistent display
            const entries = Object.entries(asset.specs)
                .map(([key, value]) => ({ key, value }))
                .sort((a, b) => a.key.localeCompare(b.key));
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
            // Convert Array back to Object and filter empty keys
            const specsObj: Record<string, string> = {};
            let hasEmptyKeys = false;

            specs.forEach(item => {
                const trimmedKey = item.key.trim();
                if (trimmedKey) {
                    specsObj[trimmedKey] = item.value;
                } else if (item.value.trim()) {
                    hasEmptyKeys = true;
                }
            });

            if (hasEmptyKeys) {
                toast.warning("Some specifications were skipped because they had no label (Key).");
            }

            // Using explicit PATCH with JSON payload
            await api.patch(`/assets/${asset.id}`, { specs: specsObj });

            toast.success("Specifications saved successfully");
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>Specifications:</span>
                        <span className="text-muted-foreground font-normal">{asset?.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="border rounded-md max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Specification (Label)</TableHead>
                                    <TableHead className="w-[50%]">Value</TableHead>
                                    <TableHead className="w-[10%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {specs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground border-none">
                                            No specifications defined yet. <br />
                                            Click "Add Specification" to start.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    specs.map((row, index) => (
                                        <TableRow key={index} className="group">
                                            <TableCell className="p-2">
                                                <Input
                                                    placeholder="e.g. Max Voltage"
                                                    value={row.key}
                                                    onChange={(e) => handleChange(index, 'key', e.target.value)}
                                                    className="border-transparent focus:border-input bg-transparent hover:bg-muted/50"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    placeholder="e.g. 240V"
                                                    value={row.value}
                                                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                                                    className="border-transparent focus:border-input bg-transparent hover:bg-muted/50 font-mono text-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteRow(index)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Button variant="outline" onClick={handleAddRow} className="w-full border-dashed">
                        <Plus className="mr-2 h-4 w-4" /> Add Specification
                    </Button>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
