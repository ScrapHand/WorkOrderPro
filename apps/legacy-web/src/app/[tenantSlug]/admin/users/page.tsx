"use client";

import React, { useEffect, useState } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Save, User as UserIcon } from 'lucide-react';

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
}

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            alert("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setSavingId(userId);
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });

            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

            // Toast placeholder
            console.log("Role updated successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to update role");
            fetchUsers(); // Revert
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            await api.delete(`/users/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to delete user");
        }
    };

    return (
        <AdminRoute>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Management</h1>
                        <p className="text-muted-foreground">Manage system access and roles.</p>
                    </div>
                    <button
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center gap-2"
                        onClick={() => alert("To invite a user, simply ask them to sign up. Detailed invites coming soon.")}
                    >
                        <UserIcon className="w-4 h-4" /> Invite User
                    </button>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="p-8 text-center">Loading users...</td></tr>
                                ) : users.map((u) => (
                                    <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{u.full_name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    className={`
                                                        bg-background border rounded-md px-2 py-1 text-xs font-semibold
                                                        ${u.role === 'ADMIN' ? 'text-red-400 border-red-900/50' :
                                                            u.role === 'MANAGER' ? 'text-blue-400 border-blue-900/50' : 'text-gray-400'}
                                                    `}
                                                    disabled={u.id === currentUser?.id || savingId === u.id}
                                                >
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="MANAGER">MANAGER</option>
                                                    <option value="TECHNICIAN">TECHNICIAN</option>
                                                    <option value="bot">BOT</option>
                                                    {/* Legacy Roles */}
                                                    <option value="admin">admin (legacy)</option>
                                                    <option value="manager">manager (legacy)</option>
                                                    <option value="engineer">engineer (legacy)</option>
                                                    <option value="viewer">viewer (legacy)</option>
                                                </select>
                                                {savingId === u.id && <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {u.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="text-red-500 hover:text-red-400 p-2 hover:bg-red-950/20 rounded-md transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminRoute>
    );
}
