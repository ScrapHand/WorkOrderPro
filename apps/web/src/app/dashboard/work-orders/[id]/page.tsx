"use client";

import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Calendar,
    Clock,
    AlertCircle,
    Wrench,
    Info,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RimeBadge = ({ score }: { score: number }) => {
    let color = "bg-green-100 text-green-800 border-green-200";
    let label = "Standard";
    if (score >= 70) {
        color = "bg-red-100 text-red-800 border-red-200";
        label = "Critical";
    } else if (score >= 40) {
        color = "bg-orange-100 text-orange-800 border-orange-200";
        label = "High Priority";
    } else if (score >= 20) {
        color = "bg-yellow-100 text-yellow-800 border-yellow-200";
        label = "Elevated";
    }

    return (
        <div className={`px-3 py-1.5 rounded-lg border font-bold flex flex-col items-center ${color}`}>
            <span className="text-2xl">{score}</span>
            <span className="text-[10px] uppercase tracking-wider">{label}</span>
        </div>
    );
};

export default function WorkOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: wo, isLoading, error } = useQuery({
        queryKey: ["workOrder", id],
        queryFn: () => AssetService.getWorkOrderById(id),
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading details...</div>;
    if (error || !wo) return <div className="p-8 text-center text-destructive">Error loading work order.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{wo.title}</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">WO-{wo.id.slice(0, 8).toUpperCase()}</span>
                        <span>&bull;</span>
                        <Calendar className="h-3 w-3" /> {new Date(wo.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex-1" />
                <Badge variant="outline" className="h-8 px-4 bg-blue-50 text-blue-700 border-blue-200">
                    {wo.status}
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" /> Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {wo.description || "No detailed description provided."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-orange-500" /> Associated Asset
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {wo.asset ? (
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                        {wo.asset.imageUrl ? (
                                            <img src={wo.asset.imageUrl} alt={wo.asset.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Wrench className="h-8 w-8 text-muted-foreground/20" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">{wo.asset.name}</div>
                                        <div className="text-sm text-muted-foreground">ID: {wo.asset.id}</div>
                                        <Button variant="link" size="sm" className="px-0 h-auto text-blue-600">View Asset Lifecycle</Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No asset associated with this work order.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Metrics */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-white to-gray-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">RIME Priority Matrix</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center py-4">
                            <RimeBadge score={wo.rimeScore} />
                        </CardContent>
                        <div className="px-6 pb-6 space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground italic">Priority Tier</span>
                                <span className="font-bold uppercase text-gray-700">{wo.priority}</span>
                            </div>
                            <div className="flex justify-between text-xs border-t pt-2">
                                <span className="text-muted-foreground">Response Goal</span>
                                <span className="font-semibold text-gray-700">
                                    {wo.priority === 'CRITICAL' ? '< 1 hour' : wo.priority === 'HIGH' ? '< 24 hours' : 'Schedule as needed'}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <div>
                                    <div className="text-xs font-bold uppercase text-gray-700">Created</div>
                                    <div className="text-sm text-muted-foreground">{new Date(wo.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                            {wo.status === 'DONE' && (
                                <div className="flex items-start gap-3 border-t pt-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <div>
                                        <div className="text-xs font-bold uppercase text-gray-700">Completed</div>
                                        <div className="text-sm text-muted-foreground">{new Date(wo.updatedAt).toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
