"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PMService } from "@/services/pm.service";
import { AssetService } from "@/services/asset.service";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Filter,
    Clock,
    CheckCircle2,
    Loader2,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    isToday
} from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";

export default function CalendarPlannerPage() {
    const router = useRouter();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    const queryClient = useQueryClient();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: schedules } = useQuery({
        queryKey: ["pm-schedules"],
        queryFn: () => PMService.getSchedules(),
    });

    const { data: workOrders } = useQuery({
        queryKey: ["planner-work-orders", format(currentDate, "yyyy-MM")],
        queryFn: () => AssetService.getWorkOrders(),
    });

    const triggerMutation = useMutation({
        mutationFn: (id: string) => PMService.triggerSchedule(id),
        onSuccess: (newWO) => {
            queryClient.invalidateQueries({ queryKey: ["planner-work-orders"] });
            queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
            setIsModalOpen(false);
            // Optional: Redirect to the new work order
            router.push(`/${tenantSlug}/dashboard/work-orders/${newWO.id}`);
        }
    });

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const getEventsForDay = (day: Date) => {
        const events: any[] = [];

        schedules?.forEach(pm => {
            if (isSameDay(new Date(pm.nextDueDate), day)) {
                events.push({
                    id: pm.id,
                    dbId: pm.id,
                    title: pm.title,
                    type: 'pm',
                    status: 'scheduled',
                    asset: pm.asset?.name,
                    frequency: pm.frequency,
                    description: pm.description
                });
            }
        });

        workOrders?.forEach(wo => {
            if (wo.dueDate && isSameDay(new Date(wo.dueDate), day)) {
                events.push({
                    id: wo.id,
                    dbId: wo.id,
                    title: wo.title,
                    type: 'wo',
                    status: wo.status,
                    priority: wo.priority,
                    assetId: wo.assetId
                });
            }
        });

        return events;
    };

    const handleEventClick = (event: any) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleImplement = () => {
        if (selectedEvent?.type === 'pm') {
            triggerMutation.mutate(selectedEvent.dbId);
        }
    };

    return (
        <div className="p-8 space-y-4 h-full flex flex-col max-w-[1600px] mx-auto">
            <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">{format(currentDate, "MMMM yyyy")}</h1>
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-3 text-xs font-semibold">
                            Today
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                </div>
            </header>

            <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const dayEvents = getEventsForDay(day);
                        const isTodayDay = isToday(day);

                        return (
                            <div
                                key={idx}
                                className={`min-h-[120px] p-2 border-r border-b border-gray-100 flex flex-col gap-1 transition-colors
                                    ${!isCurrentMonth ? 'bg-gray-50/30' : ''}
                                    ${isTodayDay ? 'bg-blue-50/20' : 'hover:bg-gray-50/10'}
                                `}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full
                                        ${isTodayDay ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500'}
                                        ${!isCurrentMonth && !isTodayDay ? 'text-gray-300' : ''}
                                    `}>
                                        {format(day, "d")}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-1 overflow-y-auto">
                                    {dayEvents.map((event, eIdx) => (
                                        <div
                                            key={eIdx}
                                            onClick={() => handleEventClick(event)}
                                            className={`px-2 py-1 rounded text-[10px] font-medium border truncate cursor-pointer transition-all hover:scale-[1.02] active:scale-95
                                                ${event.type === 'pm'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                    : event.priority === 'CRITICAL'
                                                        ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                                                        : event.priority === 'HIGH'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-1">
                                                {event.status === 'DONE' ? (
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <Clock className="h-3 w-3 opacity-60" />
                                                )}
                                                <span>{event.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedEvent?.type === 'pm' ? <Clock className="h-5 w-5 text-blue-500" /> : <CalendarIcon className="h-5 w-5 text-indigo-500" />}
                            {selectedEvent?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.type === 'pm' ? 'Preventive Maintenance Schedule' : 'Corrective Work Order'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Asset</h4>
                                <p className="text-sm font-medium">{selectedEvent?.asset || 'System Wide'}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</h4>
                                <Badge variant="secondary" className="capitalize">{selectedEvent?.status}</Badge>
                            </div>
                            {selectedEvent?.frequency && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Frequency</h4>
                                    <p className="text-sm font-medium">{selectedEvent.frequency}</p>
                                </div>
                            )}
                            {selectedEvent?.priority && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Priority</h4>
                                    <Badge variant={selectedEvent.priority === 'CRITICAL' ? 'destructive' : 'outline'}>
                                        {selectedEvent.priority}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {selectedEvent?.description && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
                                <p className="text-sm text-gray-600 line-clamp-3">{selectedEvent.description}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedEvent?.type === 'pm' ? (
                            <Button
                                onClick={handleImplement}
                                disabled={triggerMutation.isPending}
                                className="w-full sm:w-auto"
                            >
                                {triggerMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>Implement Now <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => router.push(`/${tenantSlug}/dashboard/work-orders/${selectedEvent?.dbId}`)}
                            >
                                View Detailed Record
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
