"use client";

import { useQuery } from "@tanstack/react-query";
import { AssetService } from "@/services/asset.service";
import { Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const RimeBadge = ({ score }: { score: number }) => {
    let color = "bg-green-100 text-green-800";
    if (score >= 70) color = "bg-red-100 text-red-800"; // Critical (10) * Critical (7+)
    else if (score >= 40) color = "bg-orange-100 text-orange-800"; // Med/High
    else if (score >= 20) color = "bg-yellow-100 text-yellow-800";

    return (
        <span className={`px-2 py-1 rounded font-bold ${color}`}>
            {score}
        </span>
    );
};

export default function WorkOrderList() {
    const { data: orders, isLoading } = useQuery({
        queryKey: ["workOrders"],
        queryFn: AssetService.getWorkOrders
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Work Orders</h1>
                <Link href="/dashboard/work-orders/new">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> New Work Order
                    </button>
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RIME</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>}

                        {orders?.map(wo => (
                            <tr key={wo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <RimeBadge score={wo.rimeScore} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {wo.title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    {wo.asset?.name || "Unknown Asset"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wo.priority}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {wo.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(wo.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders?.length === 0 && <div className="p-6 text-center text-gray-500">No open work orders.</div>}
            </div>
        </div>
    );
}
