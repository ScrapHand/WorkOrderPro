
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShiftService, ShiftHandover } from "@/services/shift.service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    ArrowRightLeft,
    CheckCircle2,
    AlertTriangle,
    FileText,
    History,
    Plus,
    Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ShiftHandoverBoard() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);

    const { data: handovers, isLoading } = useQuery({
        queryKey: ["shift-handovers"],
        queryFn: () => ShiftService.getAll(),
    });

    const signMutation = useMutation({
        mutationFn: (id: string) => ShiftService.sign(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shift-handovers"] });
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Shift Handovers</h2>
                    <p className="text-muted-foreground">Manage technician transitions and operational continuity.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Handover
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : handovers?.length === 0 ? (
                    <Card className="col-span-full border-dashed py-12 text-center bg-gray-50/50">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <CardTitle className="text-gray-400">No recent handovers</CardTitle>
                        <CardDescription>Start a new handover to bridge the gap between shifts.</CardDescription>
                    </Card>
                ) : (
                    handovers?.map((hando) => (
                        <Card key={hando.id} className={`shadow-md transition-all hover:shadow-lg ${hando.status === 'PENDING' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={hando.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'}>
                                        {hando.status}
                                    </Badge>
                                    <span className="text-[10px] text-gray-400 font-mono italic">
                                        {formatDistanceToNow(new Date(hando.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600" />
                                    {hando.shiftType} SHIFT
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 py-2 border-y border-gray-50">
                                    <div className="flex-1 text-center">
                                        <div className="text-[10px] uppercase text-gray-400 font-bold">Outgoing</div>
                                        <div className="text-xs font-semibold">{hando.outgoingUser.username}</div>
                                    </div>
                                    <ArrowRightLeft className="h-4 w-4 text-gray-300" />
                                    <div className="flex-1 text-center">
                                        <div className="text-[10px] uppercase text-gray-400 font-bold">Incoming</div>
                                        <div className="text-xs font-semibold">{hando.incomingUser?.username || 'PENDING'}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-red-600 font-bold">
                                        <AlertTriangle className="h-3 w-3" /> Safety Status
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {hando.content.safetyNotes}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    {hando.status === 'PENDING' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                                            onClick={() => signMutation.mutate(hando.id)}
                                            disabled={signMutation.isPending}
                                        >
                                            {signMutation.isPending ? "Signing..." : "Acknowledge & Sign"}
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 text-[10px] text-green-600 font-bold uppercase py-2 bg-green-50 rounded-md">
                                            <CheckCircle2 className="h-3 w-3" /> Transition Complete
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
