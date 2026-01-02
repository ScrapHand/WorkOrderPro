"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@/services/admin.service";
import { UserRole } from "@/lib/auth/types";
import { useState } from "react";
import { Plus, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        role: UserRole.VIEWER
    });

    const [editingUser, setEditingUser] = useState<any>(null);

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: AdminService.getUsers
    });

    const createUser = useMutation({
        mutationFn: AdminService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setIsFormOpen(false);
            setFormData({ email: "", username: "", password: "", role: UserRole.VIEWER });
        }
    });

    const editUser = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => AdminService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setEditingUser(null);
        }
    });

    const deleteUser = useMutation({
        mutationFn: AdminService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUser.mutate(formData);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        editUser.mutate({ id: editingUser.id, data: editingUser });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to terminate access for this user? This action cannot be undone.")) {
            deleteUser.mutate(id);
        }
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>

                <Button onClick={() => {
                    setIsFormOpen(!isFormOpen);
                    setEditingUser(null);
                }}>
                    <Plus className="mr-2 h-4 w-4" /> {isFormOpen ? "Cancel" : "Add User"}
                </Button>
            </div>

            {isFormOpen && (
                <div className="bg-muted/10 border p-4 rounded-lg">
                    <h3 className="font-semibold mb-4 text-blue-600">Create New User</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    value={formData.username}
                                    placeholder="e.g. jsmith"
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    {Object.values(UserRole).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={createUser.isPending}>
                                {createUser.isPending ? "Creating..." : "Create User"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {editingUser && (
                <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-semibold mb-4 text-blue-700">Edit User: {editingUser.email}</h3>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    value={editingUser.username || ""}
                                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                                >
                                    {Object.values(UserRole).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>Cancel</Button>
                            <Button type="submit" disabled={editUser.isPending}>
                                {editUser.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="border rounded-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">User</th>
                            <th className="px-4 py-3 font-medium">Username</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map(user => (
                            <tr key={user.id} className="border-t hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.email}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{user.id.slice(0, 8)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {user.username || <span className="italic opacity-50">Not set</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => {
                                        setEditingUser(user);
                                        setIsFormOpen(false);
                                    }}>
                                        Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                                        Terminate
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {users?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                    No users found in this workspace.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

