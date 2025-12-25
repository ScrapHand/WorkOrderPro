"use client";

import { useTenant } from "@/context/TenantContext";

export default function DebugPage() {
    const { tenant, isLoading, error } = useTenant();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Tenant Context</h1>

            <div className="space-y-4">
                <div className="border p-4 rounded">
                    <h2 className="font-bold">Loading State</h2>
                    <pre>{JSON.stringify({ isLoading, error }, null, 2)}</pre>
                </div>

                <div className="border p-4 rounded">
                    <h2 className="font-bold">Tenant Object</h2>
                    {tenant ? (
                        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                            {JSON.stringify(tenant, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-red-500">No tenant data</p>
                    )}
                </div>

                <div className="border p-4 rounded">
                    <h2 className="font-bold">Theme / Branding Check</h2>
                    <p>Logo URL: {tenant?.theme_json?.branding?.logoUrl || "MISSING"}</p>
                </div>
            </div>
        </div>
    );
}
