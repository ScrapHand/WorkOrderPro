"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PMService, ChecklistTemplate, PMSchedule } from "@/services/pm.service";
import { AssetService } from "@/services/asset.service";
import {
    Calendar,
    ClipboardList,
    Plus,
    Clock,
    Play,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function PMPlannerPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("schedules");

    const { data: schedules } = useQuery({
        queryKey: ["pm-schedules"],
        queryFn: () => PMService.getSchedules(),
    });

    const { data: templates } = useQuery({
        queryKey: ["checklist-templates"],
        queryFn: () => PMService.getTemplates(),
    });

    const triggerMutation = useMutation({
        mutationFn: () => PMService.triggerPMs(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
            toast.success("PM processing triggered successfully.");
        },
    });

    return (
        <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">PM Planner</h1>
                    <p className="text-muted-foreground">Manage recurring maintenance strategies and checklist templates.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => triggerMutation.mutate()} disabled={triggerMutation.isPending}>
                        <Play className="mr-2 h-4 w-4" />
                        {triggerMutation.isPending ? "Processing..." : "Trigger Due PMs"}
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                {activeTab === "schedules" ? "New Schedule" : "New Template"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {activeTab === "schedules" ? "Create PM Schedule" : "Create Checklist Template"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 text-center text-muted-foreground italic text-sm">
                                Standard creation form would go here.
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="schedules" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Schedules
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> Checklist Templates
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedules" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {schedules?.map((schedule) => (
                            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{schedule.title}</CardTitle>
                                        <Badge variant={schedule.active ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                                            {schedule.active ? 'Active' : 'Paused'}
                                        </Badge>
                                    </div>
                                    <CardDescription>{schedule.asset?.name || 'Unknown Asset'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center text-muted-foreground">
                                            <Clock className="mr-2 h-4 w-4" />
                                            <span>Frequency: <strong>{schedule.frequency}</strong></span>
                                        </div>
                                        <div className="flex items-center text-muted-foreground">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <span>Next Due: <strong>{new Date(schedule.nextDueDate).toLocaleDateString()}</strong></span>
                                        </div>
                                        {schedule.checklistTemplate && (
                                            <div className="flex items-center text-blue-600">
                                                <ClipboardList className="mr-2 h-4 w-4" />
                                                <span className="text-xs">Includes: {schedule.checklistTemplate.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {templates?.map((template) => (
                            <Card key={template.id}>
                                <CardHeader>
                                    <CardTitle>{template.name}</CardTitle>
                                    <CardDescription>{template.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold uppercase text-muted-foreground">Tasks ({template.items.length})</div>
                                        <div className="max-h-[150px] overflow-y-auto space-y-1 pr-2">
                                            {template.items.map((item) => (
                                                <div key={item.id} className="text-sm p-2 bg-muted rounded flex items-center justify-between">
                                                    <span>{item.task}</span>
                                                    {item.isRequired && <span className="text-[10px] text-red-500 font-bold uppercase">Req</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button variant="outline" size="sm">Modify Items</Button>
                                        <Button variant="ghost" size="sm" className="text-red-600">Delete</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
