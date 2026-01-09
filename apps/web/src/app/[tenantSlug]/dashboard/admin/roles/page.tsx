"use client";

import { useEffect, useState } from "react";
import { Role, AVAILABLE_PERMISSIONS } from "@/types/role";
import { RoleService } from "@/services/role.service";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash, Edit, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/auth/types";

export default function RolesPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const { data: currentUser } = useAuth();
    const canWrite = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.permissions?.includes('role:write') || currentUser?.permissions?.includes('*');

    // Queries
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: RoleService.getAll
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: RoleService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsCreateOpen(false);
            toast.success("Role created");
        },
        onError: () => toast.error("Failed to create role")
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => RoleService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setEditingRole(null);
            toast.success("Role updated");
        },
        onError: (err: any) => toast.error(err.message || "Failed to update role")
    });

    const deleteMutation = useMutation({
        mutationFn: RoleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success("Role deleted");
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete role")
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;

        // Permissions collected via state in a real form, simplified here to use form submission or separate state
        // Let's assume we capture permissions in state for the modal
    };

    if (isLoading) return <div>Loading roles...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
                    <p className="text-muted-foreground">Manage custom roles and permissions.</p>
                </div>
                {canWrite && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Role
                    </Button>
                )}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    {role.isSystem && <Shield className="h-4 w-4 text-blue-500" />}
                                    {role.name}
                                </TableCell>
                                <TableCell>{role.description || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {(Array.isArray(role.permissions) ? role.permissions : []).slice(0, 3).map(p => (
                                            <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                                        ))}
                                        {Array.isArray(role.permissions) && role.permissions.length > 3 && (
                                            <Badge variant="outline" className="text-[10px]">+{role.permissions.length - 3}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {canWrite && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingRole(role)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {!role.isSystem && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-red-50"
                                                        onClick={() => {
                                                            if (confirm('Delete role?')) deleteMutation.mutate(role.id);
                                                        }}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <RoleModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={(data) => createMutation.mutate(data)}
                title="Create Role"
            />

            {editingRole && (
                <RoleModal
                    open={!!editingRole}
                    onOpenChange={(open) => !open && setEditingRole(null)}
                    initialData={editingRole}
                    onSubmit={(data) => updateMutation.mutate({ id: editingRole.id, data })}
                    title={`Edit ${editingRole.name}`}
                    isSystem={editingRole.isSystem}
                />
            )}
        </div>
    );
}

function RoleModal({ open, onOpenChange, onSubmit, initialData, title, isSystem }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    initialData?: Role | null;
    title: string;
    isSystem?: boolean;
}) {
    const [permissions, setPermissions] = useState<string[]>(
        Array.isArray(initialData?.permissions) ? initialData.permissions : []
    );

    // Group permissions
    const groups = ['work_order', 'asset', 'inventory', 'user', 'tenant', 'report'];

    const togglePermission = (key: string) => {
        setPermissions(prev =>
            prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
        );
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
            name: formData.get("name"),
            description: formData.get("description"),
            permissions
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Define specific permissions for this role to control access to system resources.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Role Name</label>
                            <Input
                                name="name"
                                defaultValue={initialData?.name}
                                required
                                disabled={isSystem} // Prevent renaming system roles
                                placeholder="e.g. Maintenance Lead"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input name="description" defaultValue={initialData?.description} placeholder="Short description..." />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">Permissions</h3>
                        {groups.map(group => (
                            <div key={group} className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground">{group.replace('_', ' ')}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {AVAILABLE_PERMISSIONS.filter(p => p.group === group).map(perm => (
                                        <div key={perm.key} className="flex items-start space-x-2">
                                            <Checkbox
                                                id={perm.key}
                                                checked={permissions.includes(perm.key)}
                                                onCheckedChange={() => togglePermission(perm.key)}
                                            />
                                            <div className="grid gap-1 leading-none">
                                                <label
                                                    htmlFor={perm.key}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {perm.key}
                                                </label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {perm.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Role</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
