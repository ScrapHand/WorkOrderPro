"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, CheckCircle, Clock, UploadCloud, X, FileImage, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthProvider";
import { UploadService } from "@/services/upload.service";
import { PartSelector } from "../parts/part-selector";
import { Part } from "@/services/part.service";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

import { api } from "@/lib/api";

const SESSION_API = (id: string) => `/work-orders/${id}`;

export function JobSessionManager({ status, onStatusChange }: { status: string, onStatusChange: () => void }) {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [completionNotes, setCompletionNotes] = useState("");

    // [NEW] File Upload State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    // [NEW] Parts Tracking State
    const [selectedParts, setSelectedParts] = useState<{ part: Part, quantity: number }[]>([]);

    const handleAddPart = (part: Part) => {
        if (selectedParts.find(p => p.part.id === part.id)) return; // Prevent duplicates
        setSelectedParts(prev => [...prev, { part, quantity: 1 }]);
    };

    const handleRemovePart = (partId: string) => {
        setSelectedParts(prev => prev.filter(p => p.part.id !== partId));
    };

    const handleUpdateQuantity = (partId: string, qty: number) => {
        setSelectedParts(prev => prev.map(p => p.part.id === partId ? { ...p, quantity: qty } : p));
    };

    // [NEW] File Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // --- Queries ---
    const { data: sessions, isLoading } = useQuery({
        queryKey: ["workOrderSessions", id],
        queryFn: async () => {
            const res = await api.get(`${SESSION_API(id as string)}/sessions`);
            return res.data;
        },
        refetchInterval: 10000 // Refresh every 10s for live updates
    });

    // --- Mutations ---
    const startMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`${SESSION_API(id as string)}/session/start`, {});
            return res.data;
        },
        onSuccess: () => {
            toast.success("Clocked in successfully");
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
            onStatusChange();
        },
        onError: (err: any) => {
            console.error("Start Session Error", err);
            toast.error(`Failed to start work: ${err.response?.data?.error || err.message}`);
        }
    });

    const stopMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`${SESSION_API(id as string)}/session/stop`, {});
            return res.data;
        },
        onSuccess: () => {
            toast.success("Clocked out successfully");
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
        },
        onError: (err: any) => toast.error(`Failed to stop work: ${err.response?.data?.error || err.message}`)
    });

    const pauseMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`${SESSION_API(id as string)}/pause`, {});
            return res.data;
        },
        onSuccess: () => {
            toast.info("Job paused. All users clocked out.");
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
            onStatusChange();
        },
        onError: (err: any) => toast.error(`Failed to pause job: ${err.response?.data?.error || err.message}`)
    });

    const completeMutation = useMutation({
        mutationFn: async () => {
            // 1. Upload Photos First
            if (selectedFiles.length > 0) {
                toast.loading("Uploading photos...");
                try {
                    for (const file of selectedFiles) {
                        const { url, key } = await UploadService.getPresignedUrl('work-orders', id as string, file);
                        await UploadService.uploadToS3(url, file);
                        await UploadService.confirmUpload({
                            entityType: 'work-orders',
                            entityId: id as string,
                            key,
                            fileName: file.name,
                            mimeType: file.type,
                            size: file.size
                        });
                    }
                    toast.dismiss();
                    toast.success("Photos uploaded");
                } catch (err) {
                    console.error("Photo upload failed", err);
                    toast.dismiss();
                    throw new Error("Failed to upload photos. Please try again or complete without photos.");
                }
            }

            // 2. Complete Job
            const res = await api.post(`${SESSION_API(id as string)}/complete`, {
                notes: completionNotes,
                parts: selectedParts.map(p => ({ partId: p.part.id, quantity: p.quantity }))
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Job completed!");
            setIsCompleteModalOpen(false);
            setSelectedFiles([]); // Reset files
            setSelectedParts([]); // Reset parts
            setCompletionNotes(""); // Reset notes
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
            onStatusChange();
        },
        onError: (err: any) => toast.error(`Failed to complete job: ${err.message}`)
    });

    // --- Computeds ---
    const activeSessions = sessions?.filter((s: any) => !s.endTime) || [];
    const myActiveSession = activeSessions.find((s: any) => s.userId === user?.id);
    const totalDuration = sessions?.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) || 0;

    const isCompleted = status === "DONE";

    if (isCompleted) {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" /> Job Completed
                    </CardTitle>
                    <CardDescription className="text-green-700">
                        Total Time Logged: {totalDuration} minutes
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Job Execution
                    </span>
                    <Badge variant="outline">{activeSessions.length} Active Users</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    {!myActiveSession ? (
                        <Button
                            onClick={() => startMutation.mutate()}
                            disabled={startMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play className="h-4 w-4 mr-2" /> Start Work
                        </Button>
                    ) : (
                        <Button
                            onClick={() => stopMutation.mutate()}
                            variant="destructive"
                            disabled={stopMutation.isPending}
                        >
                            <Pause className="h-4 w-4 mr-2" /> Stop My Timer
                        </Button>
                    )}

                    {activeSessions.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => pauseMutation.mutate()}
                            disabled={pauseMutation.isPending}
                        >
                            Put On Hold (Pause All)
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => setIsCompleteModalOpen(true)}
                        className="ml-auto border-green-200 text-green-700 hover:bg-green-50"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" /> Complete Job
                    </Button>
                </div>

                {/* Session List */}
                <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">Active Sessions</h4>
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading sessions...</div>
                    ) : activeSessions.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">No ongoing work.</div>
                    ) : (
                        <div className="grid gap-2">
                            {activeSessions.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="font-medium">{s.user?.username || s.user?.email || "Unknown User"}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        Started {new Date(s.startTime).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total Stats */}
                <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
                    <span>Total Time Logged</span>
                    <span className="font-mono font-medium text-foreground">{totalDuration} mins</span>
                </div>
            </CardContent>

            {/* Completion Modal */}
            <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Complete Work Order</DialogTitle>
                        <DialogDescription>
                            Sign off on this job. This will stop all active timers and archive the work order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Completion Report</label>
                            <Textarea
                                placeholder="Describe the work done, parts used, and any observations..."
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Parts Used UI */}
                        <div className="space-y-2 pt-2 border-t">
                            <label className="text-sm font-medium block">Parts Used</label>
                            <div className="space-y-2 mb-2">
                                {selectedParts.map((item) => (
                                    <div key={item.part.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                                        <div className="flex-1 text-sm">
                                            <div className="font-medium">{item.part.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.part.sku} • {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.part.currency || 'GBP' }).format(item.part.cost)}
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            className="w-20 h-8"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(item.part.id, parseInt(e.target.value) || 1)}
                                            min={1}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={() => handleRemovePart(item.part.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <PartSelector onSelect={handleAddPart} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Photo Upload UI */}
                        <div className="space-y-2 pt-2 border-t">
                            <label className="text-sm font-medium block">Attach Photos</label>
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
                                    <UploadCloud className="h-5 w-5 text-gray-400" />
                                    <span className="text-[9px] text-gray-500 mt-1">Add</span>
                                    <input type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*" />
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => completeMutation.mutate()}
                            disabled={completeMutation.isPending || !completionNotes.trim()}
                            className="bg-green-600 hover:bg-green-700 min-w-[140px]"
                        >
                            {completeMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Completing...</>
                            ) : (
                                "Sign Off & Complete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
