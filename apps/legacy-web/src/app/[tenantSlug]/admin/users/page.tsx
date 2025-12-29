"use client";

import React, { useEffect, useState } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, User as UserIcon, X, Plus, ShieldCheck, ShieldAlert } from 'lucide-react';
import { User, UserRole } from '@/types';

// Extend User interface to include is_active if not already in shared types
interface ExtendedUser extends User {
    is_active?: boolean;
}

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<ExtendedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Create User State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({
        full_name: '',
        email: '',
        password: '',
        role: UserRole.TECHNICIAN
    });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setSavingId(userId);
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            alert("Failed to update role");
            fetchUsers();
        } finally {
            setSavingId(null);
        }
    };

    const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
        if (userId === currentUser?.id) return; // Prevent disabling self
        setSavingId(userId);
        try {
            // Using PUT to update is_active
            await api.put(`/users/${userId}`, { is_active: !currentStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
        } catch (err: any) {
            console.error(err);
            alert("Failed to update status");
            fetchUsers();
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

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await api.post('/users/', newUser);
            setUsers([...users, res.data]);
            setIsCreateModalOpen(false);
            setNewUser({
                full_name: '',
                email: '',
                password: '',
                role: UserRole.TECHNICIAN
            });
            alert("User created successfully");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to create user");
        } finally {
            setIsCreating(false);
        }
    };

    const getRoleBadgeStyle = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'text-red-400 border-red-900/50 bg-red-950/20';
            case UserRole.MANAGER: return 'text-blue-400 border-blue-900/50 bg-blue-950/20';
            case UserRole.ENGINEER: return 'text-purple-400 border-purple-900/50 bg-purple-950/20';
            case UserRole.TECHNICIAN: return 'text-green-400 border-green-900/50 bg-green-950/20';
            default: return 'text-gray-400 border-gray-800 bg-gray-900/50';
        }
    };

    return (
        <AdminRoute>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Management</h1>
                        <p className="text-muted-foreground">Manage system access, roles, and security permissions.</p>
                    </div>
                    <button
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <UserIcon className="w-4 h-4" /> Create User
                    </button>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Role & Permissions</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found. Create one above.</td></tr>
                                ) : users.map((u) => (
                                    <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{u.full_name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                                    className={`
                                                        appearance-none cursor-pointer border rounded-full px-3 py-1 text-xs font-semibold
                                                        focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all
                                                        ${getRoleBadgeStyle(u.role)}
                                                    `}
                                                    disabled={u.id === currentUser?.id || savingId === u.id}
                                                >
                                                    {Object.values(UserRole).map((role) => (
                                                        <option key={role} value={role} className="bg-background text-foreground">
                                                            {role.toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                {savingId === u.id && <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleStatusToggle(u.id, u.is_active ?? true)}
                                                disabled={u.id === currentUser?.id || savingId === u.id}
                                                className={`
                                                    flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all
                                                    ${(u.is_active ?? true)
                                                        ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                                                        : 'bg-muted/10 text-muted-foreground border-transparent hover:bg-muted/20'}
                                                    ${(u.id === currentUser?.id || savingId === u.id) ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {(u.is_active ?? true) ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                                {(u.is_active ?? true) ? 'Active' : 'Disabled'}
                                            </button>
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

                {/* Create User Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-card border text-card-foreground rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Create New User</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="John Doe"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="john@example.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        placeholder="••••••••"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Role</label>
                                    <select
                                        className="w-full bg-muted/50 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                    >
                                        {Object.values(UserRole).map((role) => (
                                            <option key={role} value={role}>{role.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isCreating ? 'Creating...' : <><Plus className="w-4 h-4" /> Create User</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminRoute>
    );
}
