"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HealthReport {
    status: string
    database: {
        connected: boolean
        tenants: { id: string; name: string; slug: string }[]
        error?: string
    }
    admin_user: {
        exists: boolean
        details?: {
            id: string
            role: string
            tenant_id: string | null
            is_active: boolean
        }
        warning?: string
        error?: string
    }
    cors_debug: {
        origin: string | null
        host: string | null
        user_agent: string | null
    }
}

export default function DebugPage() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<HealthReport | null>(null)
    const [error, setError] = useState<string | null>(null)

    const runAudit = async () => {
        setLoading(true)
        setError(null)
        setReport(null)

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/v1/debug/health`)

            if (!res.ok) {
                throw new Error(`API Error: ${res.status} ${res.statusText}`)
            }

            const data = await res.json()
            setReport(data)
        } catch (err: any) {
            setError(err.message || "Failed to contact API")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-10 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Health Check</h1>
                    <p className="text-muted-foreground mt-2">
                        Full-stack diagnostic tool for verifying connectivity and configuration.
                    </p>
                </div>
                <Button onClick={runAudit} disabled={loading} size="lg">
                    {loading ? "Running Audit..." : "Run Full System Audit"}
                </Button>
            </div>

            {error && (
                <Card className="border-destructive/50 bg-destructive/10 mb-6">
                    <CardHeader>
                        <CardTitle className="text-destructive">Audit Failed</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {report && (
                <div className="grid gap-6">
                    {/* Overall Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Overall Status:
                                <Badge variant={report.status === "healthy" ? "default" : "destructive"}>
                                    {report.status.toUpperCase()}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Database Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Database Connectivity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Connection Status</span>
                                    <Badge variant={report.database.connected ? "outline" : "destructive"}>
                                        {report.database.connected ? "CONNECTED" : "FAILED"}
                                    </Badge>
                                </div>
                                {report.database.error && (
                                    <p className="text-sm text-destructive font-mono bg-destructive/10 p-2 rounded">
                                        {report.database.error}
                                    </p>
                                )}
                                <div>
                                    <span className="font-semibold block mb-2">Tenants Found ({report.database.tenants.length})</span>
                                    <ul className="text-sm space-y-1">
                                        {report.database.tenants.map(t => (
                                            <li key={t.id} className="p-2 bg-muted rounded flex justify-between">
                                                <span>{t.name}</span>
                                                <code className="text-xs">{t.slug}</code>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin User Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin User Audit</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Found 'admin@example.com'</span>
                                    <Badge variant={report.admin_user.exists ? "outline" : "destructive"}>
                                        {report.admin_user.exists ? "YES" : "NO"}
                                    </Badge>
                                </div>

                                {report.admin_user.details && (
                                    <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-2 p-2 bg-muted rounded">
                                            <span className="text-muted-foreground">ID:</span>
                                            <code className="truncate">{report.admin_user.details.id}</code>

                                            <span className="text-muted-foreground">Role:</span>
                                            <span className="font-bold">{report.admin_user.details.role}</span>

                                            <span className="text-muted-foreground">Tenant ID:</span>
                                            <code className="truncate">{report.admin_user.details.tenant_id || "NULL"}</code>

                                            <span className="text-muted-foreground">Active:</span>
                                            <span>{report.admin_user.details.is_active ? "True" : "False"}</span>
                                        </div>
                                    </div>
                                )}

                                {report.admin_user.warning && (
                                    <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded text-sm font-medium border border-yellow-500/20">
                                        Warning: {report.admin_user.warning}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Environment/CORS Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>CORS & Environment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                {JSON.stringify(report.cors_debug, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            )}

            {report && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Raw JSON Response</CardTitle>
                        <CardDescription>Full backend report for debugging.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-[500px]">
                            {JSON.stringify(report, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
