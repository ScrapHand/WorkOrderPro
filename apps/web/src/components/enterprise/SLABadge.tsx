
"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { Clock, AlertCircle, TimerOff } from 'lucide-react';

interface SLABadgeProps {
    deadline: string | Date | null;
    status: string;
}

export function SLABadge({ deadline, status }: SLABadgeProps) {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const minutesLeft = differenceInMinutes(deadlineDate, now);

    let variant: "outline" | "secondary" | "destructive" | "default" = "outline";
    let icon = <Clock size={12} />;
    let label = "IN SLA";
    let style = "bg-blue-50 text-blue-700 border-blue-200";

    if (status === 'BREACHED' || minutesLeft < 0) {
        variant = "destructive";
        icon = <TimerOff size={12} />;
        label = "BREACHED";
        style = "bg-red-50 text-red-700 border-red-200";
    } else if (minutesLeft < 60) {
        variant = "default";
        icon = <AlertCircle size={12} />;
        label = "AT RISK";
        style = "bg-orange-50 text-orange-700 border-orange-200";
    }

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${style}`}>
            {icon}
            {label}
            <span className="opacity-60 normal-case font-medium border-l border-current pl-1.5 ml-0.5">
                {minutesLeft > 0 ? `${formatDistanceToNow(deadlineDate)} left` : "OVERDUE"}
            </span>
        </div>
    );
}
