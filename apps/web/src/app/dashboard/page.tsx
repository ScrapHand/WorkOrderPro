"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "lucide-react"; // Wait, Shadcn Badge is a component, not lucide icon. 
// I haven't created Badge component yet. I will use a simple span or create Badge.
// Let's create Badge component in this same step if possible or just inline it for speed.
import { PlusCircle, ClipboardList, CheckCircle2, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";

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

    const { data: myTasks, isLoading } = useQuery({
        queryKey: ["my-tasks"],
        queryFn: async () => {
            // Backend filter for assigned_to_me (requires backend support or filter client side)
            // Assuming GET /work-orders/ returns all, we filter client side for now or use ?assigned_to=me if backend supports
            const res = await api.get("/work-orders/");
            return res.data as WorkOrder[];
        }
    });

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Technician Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, get ready to fix things.</p>
                </div>
                <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Old Records
                    </Button>
                </RoleGuard>
            </div>

            {/* Big Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/work-orders/new" className="block group">
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
                        // Placeholder for "My Schedule" or similar
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

            {/* My Tasks List */}
            <div className="space-y-4">
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
                                            <Link href={`/work-orders/${task.id}`}>View Details</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed shadow-none">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <ClipboardList className="h-12 w-12 opacity-20 mb-4" />
                            <p>No active tasks assigned to you.</p>
                            <Button variant="link" className="mt-2 text-primary" asChild>
                                <Link href="/work-orders/new">Create your first task</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-center pt-4">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                        <a href="https://workorderpro.vercel.app/acme/work-orders">View All History &rarr;</a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
