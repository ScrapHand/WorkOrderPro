
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';

export function CostAnalyticsWidget() {
    return (
        <Card className="border-none shadow-sm h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={20} />
                    Maintenance Cost Analytics
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">MTD Spend</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">£12,450</span>
                            <Badge variant="outline" className="text-[10px] text-red-600 bg-red-50 border-red-100">
                                <TrendingUp size={10} className="mr-1" /> 8%
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Avg Job Cost</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">£420</span>
                            <Badge variant="outline" className="text-[10px] text-green-600 bg-green-50 border-green-100">
                                <TrendingDown size={10} className="mr-1" /> 12%
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <p className="text-sm font-semibold mb-3">Top Cost Centers</p>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>Conveyor System A</span>
                                <span className="font-medium text-gray-900">£4,200</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[60%]" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span>Packaging Line 2</span>
                                <span className="font-medium text-gray-900">£2,800</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-[40%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Badge({ children, className, variant }: any) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${className}`}>
            {children}
        </span>
    );
}
