"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole, User } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"; // Assuming table component exists? No, I checked and it wasn't there. I'll use standard HTML table with Tailwind classes.
import { Plus, Trash2, Shield, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export default function UserManagementPage() {
    return (
        <RoleGuard allowedRoles={[UserRole.ADMIN]}>
            <UserManagementContent />
        </RoleGuard>
    );
}

function UserManagementContent() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "technician" as UserRole // Default
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get("/users/");
            return res.data as User[];
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.post("/users/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsCreateOpen(false);
            setFormData({ email: "", password: "", full_name: "", role: UserRole.TECHNICIAN });
            toast.success("User created successfully");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Failed to create user");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            return api.delete(`/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Failed to delete user");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage system access and roles.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Custom Table Implementation since Shadcn Table might be missing */}
            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Contact</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-4 text-center">Loading users...</td></tr>
                            ) : users?.map((user) => (
                                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                                                {user.full_name?.charAt(0) || "U"}
                                            </div>
                                            {user.full_name || "Unknown"}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                user.role === 'manager' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                    'bg-green-50 text-green-700 ring-green-600/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
                                                    deleteMutation.mutate(user.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Modal for Create User */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in-95 border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Invite New User</h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">X</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    required
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="john@company.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    required
                                    placeholder="Secret123!"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value={UserRole.TECHNICIAN}>Technician</option>
                                    <option value={UserRole.MANAGER}>Manager</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                    <option value={UserRole.VIEWER}>Viewer</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? "Creating..." : "Send Invite"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
