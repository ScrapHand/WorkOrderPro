"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Info,
    Play,
    CheckCircle2,
    AlertCircle,
    Database,
    MapPin,
    Tag
} from "lucide-react";
import { AssetService } from '@/services/asset.service';
import { toast } from "sonner";

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedAsset {
    name: string;
    criticality: 'A' | 'B' | 'C';
    type: string;
    description: string;
    tags: string[];
    location: string | null;
    children: ParsedAsset[];
}

const DEFAULT_EXAMPLE = `[A] Production Line 01 ::Line // Main manufacturing line
    [A] CNC Milling Center ::Machine @ "Hall A" #milling
        [B] Spindle Motor ::Motor #critical
        [C] Coolant Pump ::Pump
    [B] Quality Station ::Station @ "Hall A"
        Scanner Alpha ::Instrument #optical`;

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
    const [dslText, setDslText] = useState(DEFAULT_EXAMPLE);
    const [preview, setPreview] = useState<ParsedAsset[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    // Simple parser logic (shared with backend logic)
    const parseDSL = (text: string): ParsedAsset[] => {
        const lines = text.split('\n');
        const roots: ParsedAsset[] = [];
        const stack: { level: number; asset: ParsedAsset }[] = [];

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0 || trimmedLine.startsWith('//')) return;

            const indentSpaces = line.length - line.trimStart().length;
            const level = Math.floor(indentSpaces / 4);

            const parsed = parseLine(trimmedLine);

            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                roots.push(parsed);
            } else {
                stack[stack.length - 1].asset.children.push(parsed);
            }

            stack.push({ level, asset: parsed });
        });

        return roots;
    };

    const parseLine = (content: string): ParsedAsset => {
        let description = '';
        const descMatch = content.match(/\/\/(.*)$/);
        if (descMatch) {
            description = descMatch[1].trim();
            content = content.replace(/\/\/(.*)$/, '').trim();
        }

        let criticality: 'A' | 'B' | 'C' = 'C';
        const critMatch = content.match(/^\[([ABC])\]/i);
        if (critMatch) {
            criticality = critMatch[1].toUpperCase() as 'A' | 'B' | 'C';
            content = content.replace(/^\[([ABC])\]/i, '').trim();
        }

        let location: string | null = null;
        const locMatch = content.match(/@\s*"([^"]+)"/);
        if (locMatch) {
            location = locMatch[1];
            content = content.replace(/@\s*"([^"]+)"/, '').trim();
        }

        let type = 'Equipment';
        const typeMatch = content.match(/::([\w-]+)/);
        if (typeMatch) {
            type = typeMatch[1];
            content = content.replace(/::([\w-]+)/, '').trim();
        }

        const tags: string[] = [];
        const tagMatches = content.matchAll(/#([\w-]+)/g);
        for (const match of tagMatches) {
            tags.push(match[1]);
        }
        content = content.replace(/#([\w-]+)/g, '').trim();

        const name = content || 'Unnamed Asset';

        return { name, criticality, type, description, tags, location, children: [] };
    };

    useEffect(() => {
        try {
            const parsed = parseDSL(dslText);
            setPreview(parsed);
        } catch (e) {
            console.error(e);
        }
    }, [dslText]);

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const res = await AssetService.importBulk(dslText);
            toast.success(res.message);
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Bulk import failed");
        } finally {
            setIsImporting(false);
        }
    };

    const renderPreviewNode = (node: ParsedAsset, depth = 0) => (
        <div key={node.name + depth} className="mb-2">
            <div className={`flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors`}>
                <div
                    className={`w-1 h-8 rounded-full ${node.criticality === 'A' ? 'bg-red-500' :
                            node.criticality === 'B' ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold truncate text-sm">{node.name}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">
                            {node.type}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        {node.location && (
                            <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" /> {node.location}
                            </span>
                        )}
                        {node.tags.length > 0 && (
                            <span className="flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" /> {node.tags.join(', ')}
                            </span>
                        )}
                        {node.description && (
                            <span className="truncate flex-1 italic opacity-60 ml-1">// {node.description}</span>
                        )}
                    </div>
                </div>
            </div>
            {node.children.length > 0 && (
                <div className="ml-4 mt-2 pl-2 border-l border-dashed border-muted">
                    {node.children.map(child => renderPreviewNode(child, depth + 1))}
                </div>
            )}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="mb-4">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        <DialogTitle className="text-2xl">Bulk Asset Seeding</DialogTitle>
                    </div>
                    <DialogDescription>
                        Paste your "Industrial Blueprint" text below to mass-generate asset hierarchies.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                    {/* Left Side: Editor */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                            <span>Blueprint Editor</span>
                            <Badge variant="secondary" className="text-[9px]">4 Spaces = Depth</Badge>
                        </div>
                        <Textarea
                            className="flex-1 font-mono text-sm resize-none bg-slate-900 text-slate-100 p-4 leading-relaxed focus-visible:ring-primary border-slate-800"
                            placeholder="[A] Site Name ::Site..."
                            value={dslText}
                            onChange={(e) => setDslText(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-lg border border-dashed">
                            <div className="flex items-center gap-1.5"><span className="text-red-500 font-bold w-4 text-center">[A]</span> Criticality</div>
                            <div className="flex items-center gap-1.5"><span className="text-primary font-bold w-4 text-center">::</span> Asset Type</div>
                            <div className="flex items-center gap-1.5"><span className="text-blue-500 font-bold w-4 text-center">#</span> Tags</div>
                            <div className="flex items-center gap-1.5"><span className="text-amber-500 font-bold w-4 text-center">@</span> Location</div>
                        </div>
                    </div>

                    {/* Right Side: Preview */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                            <span>Hierarchy Preview</span>
                            <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                        </div>
                        <div className="flex-1 rounded-xl border bg-muted/20 p-4 overflow-y-auto">
                            {preview.length > 0 ? (
                                <div className="space-y-3">
                                    {preview.map(node => renderPreviewNode(node))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 opacity-30">
                                    <AlertCircle className="w-10 h-10" />
                                    <p className="text-xs">No valid content to preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                    <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground italic">
                        <Info className="w-3.5 h-3.5" />
                        <span>This will create all assets and their children in one operation.</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
                        <Button
                            className="gap-2 px-6"
                            size="sm"
                            disabled={preview.length === 0 || isImporting}
                            onClick={handleImport}
                        >
                            {isImporting ? "Building..." : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Launch Blueprint
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
