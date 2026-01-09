"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, FileText, User as UserIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
    id: string;
    event: string;
    timestamp: string;
    userId: string;
    user?: {
        email: string;
        username: string;
    };
    metadata: any;
}

export default function AuditLogsPage() {
    const params = useParams();
    const tenantSlug = params?.tenantSlug as string;

    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ["audit-logs", tenantSlug],
        queryFn: async () => {
            const res = await api.get("/tenant/audit-logs");
            return res.data;
        }
    });

    const getEventBadge = (event: string) => {
        const e = event.toUpperCase();
        if (e.includes("FAILURE") || e.includes("UNAUTHORIZED")) return "destructive";
        if (e.includes("SUCCESS") || e.includes("CREATE")) return "default";
        if (e.includes("UPDATE") || e.includes("PATCH")) return "secondary";
        return "outline";
    };

    return (
        <div className="space-y-6">
            <header>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Security Audit Logs</h1>
                        <p className="text-muted-foreground">Monitor system activity and security events for your organization.</p>
                    </div>
                </div>
            </header>

            <Card className="border-border/60">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle>Activity Feed</CardTitle>
                            <CardDescription>Latest 50 security events</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : logs && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="group">
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(log.timestamp), "MMM dd, HH:mm:ss")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getEventBadge(log.event)} className="text-[10px] uppercase tracking-wider font-bold h-5">
                                                    {log.event.replace(/_/g, " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{log.user?.email || "System"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <div className="text-xs text-muted-foreground truncate group-hover:whitespace-normal group-hover:break-all">
                                                    {JSON.stringify(log.metadata)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
