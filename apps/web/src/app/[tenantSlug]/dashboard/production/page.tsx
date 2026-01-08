"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductionLineService } from "@/services/production-line.service";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Layout, Activity, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProductionLinesPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const tenantSlug = params.tenantSlug as string;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const { data: lines, isLoading } = useQuery({
        queryKey: ["production-lines"],
        queryFn: ProductionLineService.getAll
    });

    const createMutation = useMutation({
        mutationFn: ProductionLineService.create,
        onSuccess: (newLine) => {
            queryClient.invalidateQueries({ queryKey: ["production-lines"] });
            setIsCreateOpen(false);
            setNewName("");
            setNewDesc("");
            router.push(`/${tenantSlug}/dashboard/production/${newLine.id}`);
        }
    });

    const handleCreate = () => {
        if (!newName.trim()) return;
        createMutation.mutate({ name: newName, description: newDesc });
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading production lines...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Production Lines</h1>
                    <p className="text-muted-foreground">Model and analyze your factory flow for bottleneck optimization.</p>
                </div>
                <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4" /> New Line
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lines?.map((line) => (
                    <Card key={line.id} className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/20" onClick={() => router.push(`/${tenantSlug}/dashboard/production/${line.id}`)}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <Layout className="h-5 w-5 text-primary" />
                                </div>
                                {!line.bottleneckCount || line.bottleneckCount === 0 ? (
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 flex gap-1 items-center">
                                        <Activity className="h-3 w-3" /> Balanced
                                    </Badge>
                                ) : line.bottleneckCount <= 2 ? (
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 flex gap-1 items-center">
                                        <AlertTriangle className="h-3 w-3" /> Constrained
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100 flex gap-1 items-center">
                                        <AlertTriangle className="h-3 w-3" /> Obstructed
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="mt-4">{line.name}</CardTitle>
                            <CardDescription>{line.description || "No description provided."}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <span className="font-bold text-gray-900">{line.assetCount || 0}</span> Assets Linked
                                </div>
                                <div className="flex items-center gap-1 text-primary font-medium">
                                    Open Editor <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {lines?.length === 0 && (
                    <Card className="border-dashed border-2 bg-slate-50 flex flex-col items-center justify-center p-12 text-center col-span-full">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No Production Lines Established</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            Start by creating a visual model of your assembly or processing line to identify bottlenecks and optimize OEE.
                        </p>
                        <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>Create Your First Line</Button>
                    </Card>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Production Line</DialogTitle>
                        <DialogDescription>
                            Define a new manufacturing flow to map your assets.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Line Name</Label>
                            <Input
                                id="name"
                                placeholder="Assembly Line A"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Description (Optional)</Label>
                            <Textarea
                                id="desc"
                                placeholder="Primary bottling and labeling line..."
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!newName.trim() || createMutation.isPending}
                        >
                            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create & Open Flow Editor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
