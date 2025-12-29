"use client";

import React from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import UserList from '@/components/admin/UserList';

export default function UserManagementPage() {
    return (
        <AdminRoute>
            <div className="p-8 max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Management</h1>
                <p className="text-muted-foreground mb-8">Manage system access, roles, and security permissions.</p>
                <div className="glass-panel rounded-lg border bg-surface/50 p-6">
                    <UserList />
                </div>
            </div>
        </AdminRoute>
    );
}
