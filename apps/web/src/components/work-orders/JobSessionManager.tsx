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
import { Play, Pause, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthProvider";

const SESSION_API = (id: string) => `/api/v1/work-orders/${id}`;

export function JobSessionManager({ status, onStatusChange }: { status: string, onStatusChange: () => void }) {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [completionNotes, setCompletionNotes] = useState("");

    // --- Queries ---
    const { data: sessions, isLoading } = useQuery({
        queryKey: ["workOrderSessions", id],
        queryFn: async () => {
            const res = await fetch(`${SESSION_API(id as string)}/sessions`);
            if (!res.ok) throw new Error("Failed to fetch sessions");
            return res.json();
        },
        refetchInterval: 10000 // Refresh every 10s for live updates
    });

    // --- Mutations ---
    const startMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${SESSION_API(id as string)}/session/start`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to start session");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Clocked in successfully");
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
            onStatusChange();
        },
        onError: () => toast.error("Failed to start work")
    });

    const stopMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${SESSION_API(id as string)}/session/stop`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to stop session");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Clocked out successfully");
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
        },
        onError: () => toast.error("Failed to stop work")
    });

    const pauseMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${SESSION_API(id as string)}/pause`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to pause job");
            return res.json();
        },
        onSuccess: () => {
            toast.info("Job paused. All users clocked out.");
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
            onStatusChange();
        },
        onError: () => toast.error("Failed to pause job")
    });

    const completeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${SESSION_API(id as string)}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: completionNotes })
            });
            if (!res.ok) throw new Error("Failed to complete job");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Job completed!");
            setIsCompleteModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["workOrderSessions"] });
            onStatusChange();
        },
        onError: () => toast.error("Failed to complete job")
    });

    // --- Computeds ---
    const activeSessions = sessions?.filter((s: any) => !s.endTime) || [];
    const myActiveSession = activeSessions.find((s: any) => s.userId === user?.id);
    const totalDuration = sessions?.reduce((acc: number, s: any) => acc + (s.duration || 0), 0) || 0;

    const isCompleted = status === "COMPLETED";

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
                <DialogContent>
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
                        <div className="p-3 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800">
                            <strong>Note:</strong> Photo upload will be available in the next update. Please attach any photos to the main attachments section for now.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => completeMutation.mutate()}
                            disabled={completeMutation.isPending || !completionNotes.trim()}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Sign Off & Complete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
