"use client";

import { useUser } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
    const { data: user, isLoading } = useUser();

    if (isLoading) {
        return <div className="p-8">Loading profile...</div>;
    }

    if (!user) {
        return <div className="p-8">Please log in to view your profile.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>

            <Card className="premium-card">
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <p className="text-lg font-medium">{user.full_name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-lg font-medium">{user.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Role</label>
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {user.role}
                            </span>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">User ID</label>
                            <p className="text-sm font-mono text-muted-foreground">{user.id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="premium-card">
                <CardHeader>
                    <CardTitle>Session Debug</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}
