
import React from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, List } from 'lucide-react';

interface StatsProps {
    stats: {
        active_total: number;
        by_status: Record<string, number>;
        by_priority: Record<string, number>;
    } | null;
}

const COLORS = {
    new: '#3b82f6', // blue
    in_progress: '#f59e0b', // amber
    on_hold: '#6b7280', // gray
    completed: '#22c55e', // green

    // Priority
    low: '#22c55e',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444'
};

const STATUS_LABELS: Record<string, string> = {
    new: 'New',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed'
};

export default function WorkOrderStats({ stats }: StatsProps) {
    if (!stats) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>;

    const statusData = Object.entries(stats.by_status || {}).map(([key, value]) => ({
        name: STATUS_LABELS[key] || key,
        value,
        key
    }));

    const priorityData = Object.entries(stats.by_priority || {}).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
        key
    }));

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Active Workload"
                    value={stats.active_total}
                    icon={<List className="text-blue-500" />}
                    trend="In queue"
                />
                <StatCard
                    title="On Hold / Parts"
                    value={(stats.by_status['on_hold'] || 0) + (stats.by_status['waiting_parts'] || 0)}
                    icon={<Clock className="text-gray-500" />}
                    trend="Paused"
                />
                <StatCard
                    title="Critical"
                    value={stats.by_priority['critical'] || 0}
                    icon={<AlertTriangle className="text-red-500" />}
                    trend="Response required"
                />
                <StatCard
                    title="Signed Off Today"
                    value={stats.by_status['completed'] || 0}
                    icon={<CheckCircle className="text-green-500" />}
                    trend="Accomplished"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Chart */}
                <div className="bg-surface border rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Status Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                        {statusData.map((s) => (
                            <div key={s.name} className="flex items-center text-sm text-gray-600">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[s.key as keyof typeof COLORS] || '#8884d8' }}></span>
                                {s.name}: {s.value}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Priority Chart */}
                <div className="bg-surface border rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Priority Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={80} />
                                <RechartsTooltip />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.key as keyof typeof COLORS] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number, icon: React.ReactNode, trend: string }) {
    return (
        <div className="bg-surface border rounded-lg p-6 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                <p className="text-xs text-gray-400 mt-2">{trend}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                {icon}
            </div>
        </div>
    );
}
