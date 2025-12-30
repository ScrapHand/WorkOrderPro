"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "lucide-react"; // Wait, Shadcn Badge is a component, not lucide icon. 
// I haven't created Badge component yet. I will use a simple span or create Badge.
// Let's create Badge component in this same step if possible or just inline it for speed.
import { PlusCircle, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
            <Card>
                <CardHeader>
                    <CardTitle>My Active Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center p-8 text-muted-foreground">Loading tasks...</div>
                    ) : myTasks && myTasks.length > 0 ? (
                        <div className="divide-y">
                            {myTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="py-4 flex items-center justify-between hover:bg-muted/30 px-2 rounded-lg transition-colors">
                                    <div className="flex items-center gap-4">
                                        {task.status === 'completed' ? <CheckCircle2 className="text-green-500 h-5 w-5" /> : <Clock className="text-amber-500 h-5 w-5" />}
                                        <div>
                                            <h4 className="font-semibold">{task.title}</h4>
                                            <p className="text-xs text-muted-foreground">{task.work_order_number || "WO-PENDING"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                            ${task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                task.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {task.priority}
                                        </span>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/work-orders/${task.id}`}>View</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground">No active tasks assigned to you.</div>
                    )}

                    <div className="pt-4 text-center">
                        <Button variant="link" asChild>
                            {/* Link to Legacy for full list if needed */}
                            <a href="https://workorderpro.vercel.app/acme/work-orders">View All Tasks in Legacy App &rarr;</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
