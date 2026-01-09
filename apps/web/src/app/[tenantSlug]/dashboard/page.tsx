"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ClipboardList, CheckCircle2, Clock, Trash2, AlertTriangle, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkOrderTable } from "@/components/work-orders/WorkOrderTable";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder type
type WorkOrder = {
    id: string;
    title: string;
    status: string;
    priority: string;
    work_order_number?: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';

    const { data: myTasks, isLoading } = useQuery({
        queryKey: ["my-tasks"],
        queryFn: async () => {
            // New Endpoint: Jobs I am currently clocked into
            const res = await api.get("/work-orders/my-active");
            // The backend returns Session[] with nested WorkOrder.
            // We need to map it to flatten the WorkOrder properties for the UI.
            // Backend maps: { ...session, workOrder: wo }
            return res.data.map((item: any) => ({
                ...item.workOrder,
                sessionId: item.id,
                startTime: item.startTime
            })) as WorkOrder[];
        },
        refetchInterval: 15000
    });



    const { data: criticalJobs } = useQuery({
        queryKey: ["critical-jobs"],
        queryFn: async () => {
            const res = await api.get("/work-orders", {
                params: { priority: "critical", status: "OPEN" } // OPEN or IN_PROGRESS via backend filter if multi-status supported? 
                // Note: Backend currently supports single status. Frontend will filter just to be safe.
            });
            // Filter for non-completed just in case
            return res.data.filter((wo: any) => wo.status !== 'DONE' && wo.status !== 'COMPLETED');
        },
        refetchInterval: 30000 // Check every 30s
    });


    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Critical Line Down Alert */}
            {criticalJobs && criticalJobs.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
                        </div>
                        <div className="ml-3 w-full">
                            <h3 className="text-lg font-bold text-red-800 uppercase tracking-wider">
                                Line Down Detected
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p className="mb-2">The following critical assets are down. Immediate attention required:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {criticalJobs.map((job: any) => (
                                        <li key={job.id} className="font-medium">
                                            <Link href={`/${tenantSlug}/dashboard/work-orders/${job.id}`} className="hover:underline flex items-center gap-2">
                                                {job.asset?.name || "Unknown Asset"} — {job.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Technician Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, get ready to fix things.</p>
                </div>

            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/50 backdrop-blur border-slate-200/60 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${criticalJobs && criticalJobs.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{criticalJobs?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active critical work orders</p>
                    </CardContent>
                </Card>


                <Card className="bg-white/50 backdrop-blur border-slate-200/60 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Queue</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myTasks?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Tasks currently assigned to you</p>
                    </CardContent>
                </Card>
            </div>

            {/* Big Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href={`/${tenantSlug}/dashboard/work-orders/new`} className="block group">
                    <Card className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer border-0">
                        <CardContent className="flex items-center justify-between p-8">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl">Create Work Order</CardTitle>
                                <CardDescription className="text-primary-foreground/80">Report a new issue or breakdown</CardDescription>
                            </div>
                            <PlusCircle className="h-12 w-12 group-hover:scale-110 transition-transform" />
                        </CardContent>
                    </Card>
                </Link>

                <div className="block">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                        router.push(`/${tenantSlug}/dashboard/work-orders?assignee=me`);
                    }}>
                        <CardContent className="flex items-center justify-between p-8">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl">My Schedule</CardTitle>
                                <CardDescription>View assigned PMs and tasks for today</CardDescription>
                            </div>
                            <ClipboardList className="h-12 w-12 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="my-tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="my-tasks">My Active Tasks</TabsTrigger>
                    <TabsTrigger value="active-wo">Active Work Orders</TabsTrigger>
                </TabsList>

                <TabsContent value="my-tasks" className="space-y-4 mt-6">
                    <h2 className="text-xl font-semibold tracking-tight">My Active Tasks</h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="h-32 animate-pulse bg-muted/50" />
                            ))}
                        </div>
                    ) : myTasks && myTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myTasks?.slice(0, 6).map(task => (
                                <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer bg-card border-border/60">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <Badge className={`uppercase text-[10px] px-2 py-0.5 border-none
                                            ${task.priority === 'critical' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                    task.priority === 'high' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                                        'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                {task.priority || 'NORMAL'}
                                            </Badge>
                                            {task.status === 'completed'
                                                ? <CheckCircle2 className="text-green-500 h-4 w-4" />
                                                : <Clock className="text-muted-foreground h-4 w-4" />
                                            }
                                        </div>
                                        <CardTitle className="text-base font-medium line-clamp-1 mt-2">
                                            {task.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-mono">
                                            {task.work_order_number || "WO-PENDING"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-end pt-2">
                                            <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full">
                                                <Link href={`/${tenantSlug}/dashboard/work-orders/${task.id}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed shadow-sm bg-slate-50/50">
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                    <ClipboardList className="h-8 w-8 text-blue-500/50" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h3>
                                <p className="max-w-sm mx-auto mb-6">You don't have any active tasks assigned to you right now.</p>
                                <Button variant="default" className="shadow-sm" asChild>
                                    <Link href={`/${tenantSlug}/dashboard/work-orders/new`}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Create Work Order
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-center pt-4">
                        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                            <Link href={`/${tenantSlug}/dashboard/work-orders`}>View All History &rarr;</Link>
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="active-wo" className="mt-6">
                    <WorkOrderTable statusFilter="OPEN" enableFilters={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
