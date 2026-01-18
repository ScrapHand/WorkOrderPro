
"use client";

import { useQuery } from "@tanstack/react-query";
import { InventoryService } from "@/services/inventory.service";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export function InventoryAlertsBanner() {
    const router = useRouter();
    const { tenantSlug } = useParams();

    const { data: alerts, isLoading } = useQuery({
        queryKey: ["inventory-alerts"],
        queryFn: () => InventoryService.getAlerts(),
        refetchInterval: 30000, // Refresh every 30s
    });

    const activeAlerts = alerts?.filter(a => a.status === 'ACTIVE') || [];

    if (isLoading) return null;
    if (activeAlerts.length === 0) return null;

    return (
        <div className="space-y-3 mb-6">
            {activeAlerts.map((alert) => (
                <Alert
                    key={alert.id}
                    variant={alert.type === 'CRITICAL' ? 'destructive' : 'default'}
                    className={`shadow-lg border-2 ${alert.type === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${alert.type === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <AlertTitle className={`font-bold uppercase tracking-wider text-xs ${alert.type === 'CRITICAL' ? 'text-red-800' : 'text-orange-800'}`}>
                                    {alert.type} INVENTORY ALERT
                                </AlertTitle>
                                <AlertDescription className={`text-sm ${alert.type === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}`}>
                                    {alert.message}
                                </AlertDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${alert.type === 'CRITICAL' ? 'hover:bg-red-100 text-red-800' : 'hover:bg-orange-100 text-orange-800'} font-bold flex items-center gap-2`}
                            onClick={() => router.push(`/${tenantSlug}/dashboard/inventory`)}
                        >
                            Open Inventory <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </Alert>
            ))}
        </div>
    );
}
