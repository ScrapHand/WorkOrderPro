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
        password: "",
        role: UserRole.VIEWER
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users"],
        queryFn: AdminService.getUsers
    });

    const createUser = useMutation({
        mutationFn: AdminService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
            setIsFormOpen(false);
            setFormData({ email: "", password: "", role: UserRole.VIEWER });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUser.mutate(formData);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>

                <Button onClick={() => setIsFormOpen(!isFormOpen)}>
                    <Plus className="mr-2 h-4 w-4" /> {isFormOpen ? "Cancel" : "Add User"}
                </Button>
            </div>

            {isFormOpen && (
                <div className="bg-muted/10 border p-4 rounded-lg">
                    <h3 className="font-semibold mb-4">Create New User</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="border rounded-md">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map(user => (
                            <tr key={user.id} className="border-t hover:bg-muted/50">
                                <td className="px-4 py-3 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    {user.email}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : "-"}
                                </td>
                            </tr>
                        ))}
                        {users?.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
