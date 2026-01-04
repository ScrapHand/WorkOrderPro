"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FeatureKey } from "@/hooks/usePermission";

const FEATURES: { key: FeatureKey; label: string }[] = [
    { key: "view_financials", label: "View Financials" },
    { key: "delete_assets", label: "Delete Assets" },
    { key: "create_work_orders", label: "Create Work Orders" },
    { key: "manage_users", label: "Manage Users" },
    { key: "edit_branding", label: "Edit Settings & Branding" },
];

const ROLES = ["ADMIN", "TECHNICIAN", "VIEWER"];

export default function RbacPage() {
    const { config, refreshConfig } = useTheme();
    const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (config?.rbac) {
            setMatrix(config.rbac);
        } else {
            // Initialize defaults
            const defaults: any = {};
            ROLES.forEach(r => defaults[r] = {});
            setMatrix(defaults);
        }
    }, [config]);

    const togglePermission = (role: string, feature: string) => {
        setMatrix(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [feature]: !Boolean(prev[role]?.[feature])
            }
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            // We preserve branding, only update rbac
            await api.patch("/tenant/config", {
                rbac: matrix
            });
            toast.success("Permissions updated");
            refreshConfig();
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Permissions Matrix</h2>
                <p className="text-muted-foreground">Manage feature access per role.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Role Configuration</CardTitle>
                    <CardDescription>Toggle features on or off for each role. Changes apply immediately after save.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Feature</TableHead>
                                {ROLES.map(role => (
                                    <TableHead key={role} className="text-center">{role}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {FEATURES.map((feat) => (
                                <TableRow key={feat.key}>
                                    <TableCell className="font-medium">{feat.label}</TableCell>
                                    {ROLES.map(role => {
                                        const isChecked = matrix[role]?.[feat.key] ?? (role === 'ADMIN'); // Admin default true
                                        return (
                                            <TableCell key={role} className="text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 accent-primary cursor-pointer"
                                                    checked={isChecked}
                                                    onChange={() => togglePermission(role, feat.key)}
                                                    disabled={role === 'ADMIN' && feat.key === 'manage_users'}
                                                />
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save Configuration"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
