"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PMService } from "@/services/pm.service";
import { AssetService } from "@/services/asset.service";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Filter,
    Clock,
    CheckCircle2
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

export default function CalendarPlannerPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: schedules } = useQuery({
        queryKey: ["pm-schedules"],
        queryFn: () => PMService.getSchedules(),
    });

    const { data: workOrders } = useQuery({
        queryKey: ["planner-work-orders", format(currentDate, "yyyy-MM")],
        queryFn: () => AssetService.getWorkOrders(),
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
                    id: `pm-${pm.id}`,
                    title: pm.title,
                    type: 'pm',
                    status: 'scheduled',
                    asset: pm.asset?.name
                });
            }
        });

        workOrders?.forEach(wo => {
            if (wo.dueDate && isSameDay(new Date(wo.dueDate), day)) {
                events.push({
                    id: `wo-${wo.id}`,
                    title: wo.title,
                    type: 'wo',
                    status: wo.status,
                    priority: wo.priority
                });
            }
        });

        return events;
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
                                            className={`px-2 py-1 rounded text-[10px] font-medium border truncate cursor-pointer transition-all hover:scale-[1.02] active:scale-95
                                                ${event.type === 'pm'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
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
        </div>
    );
}
