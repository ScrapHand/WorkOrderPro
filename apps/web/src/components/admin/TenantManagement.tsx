"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenantService } from "@/services/tenant.service";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PlayCircle, Plus, Building2, Trash2, Settings2 } from "lucide-react";

export function TenantManagement() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<any>(null);
    const [newTenant, setNewTenant] = useState({ name: "", slug: "", adminEmail: "", maxUsers: 5, maxAdmins: 1 });

    // --- Queries ---
    const { data: tenants, isLoading } = useQuery({
        queryKey: ["tenants"],
        queryFn: TenantService.getAll
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: TenantService.create,
        onSuccess: () => {
            toast.success("Tenant created successfully");
            setIsCreateOpen(false);
            setNewTenant({ name: "", slug: "", adminEmail: "", maxUsers: 5, maxAdmins: 1 });
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
        },
        onError: (err: any) => toast.error(`Failed: ${err.message}`)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => TenantService.updateEntitlements(id, data),
        onSuccess: () => {
            toast.success("Tenant updated successfully");
            setEditingTenant(null);
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
        },
        onError: (err: any) => toast.error(`Update Failed: ${err.message}`)
    });

    const seedMutation = useMutation({
        mutationFn: TenantService.seedDemo,
        onSuccess: () => {
            toast.success("Demo data seeded! Log in as the new admin to see it.");
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
        },
        onError: (err: any) => toast.error(`Seed Failed: ${err.message}`)
    });

    const deleteMutation = useMutation({
        mutationFn: TenantService.delete,
        onSuccess: () => {
            toast.success("Tenant deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["tenants"] });
        },
        onError: (err: any) => toast.error(`Delete Failed: ${err.message}`)
    });

    const handleCreate = () => {
        if (!newTenant.slug.match(/^[a-z0-9-]+$/)) {
            toast.error("Slug must be lowercase alphanumeric (hyphens allowed)");
            return;
        }
        createMutation.mutate(newTenant);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tenant Management</h2>
                    <p className="text-muted-foreground">Create and manage access for organizations.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Organization</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Organization Name</Label>
                                <Input
                                    value={newTenant.name}
                                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                    placeholder="e.g. Aston Manor Cider"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL Slug</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-sm">app.workorderpro.com/</span>
                                    <Input
                                        value={newTenant.slug}
                                        onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase() })}
                                        placeholder="aston-manor"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Admin Email</Label>
                                <Input
                                    value={newTenant.adminEmail}
                                    onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                                    placeholder="admin@company.com"
                                />
                                <p className="text-xs text-muted-foreground">Default password will be 'ScrapHand'</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Max Users</Label>
                                    <Input
                                        type="number"
                                        value={newTenant.maxUsers}
                                        onChange={(e) => setNewTenant({ ...newTenant, maxUsers: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Admins</Label>
                                    <Input
                                        type="number"
                                        value={newTenant.maxAdmins}
                                        onChange={(e) => setNewTenant({ ...newTenant, maxAdmins: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create Organization
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : tenants?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No tenants found.</TableCell>
                            </TableRow>
                        ) : (
                            tenants?.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            {tenant.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="bg-muted px-1 py-0.5 rounded text-xs">{tenant.slug}</code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground">
                                            {tenant._count?.users || 0} / {tenant.maxUsers} Users • {tenant.maxAdmins} Max Admins
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingTenant(tenant)}
                                            >
                                                <Settings2 className="h-3 w-3 mr-1" />
                                                Quotas
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Populate ${tenant.name} with Aston Manor demo data? This creates Assets, Parts, and Work Orders.`)) {
                                                        seedMutation.mutate(tenant.id);
                                                    }
                                                }}
                                                disabled={seedMutation.isPending || (tenant._count?.assets || 0) > 0}
                                            >
                                                {seedMutation.isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <PlayCircle className="h-3 w-3 mr-1" />
                                                )}
                                                {seedMutation.isPending ? "Seeding..." : "Seed Demo"}
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm(`DANGER: Are you sure you want to delete ${tenant.name}? This will permanently remove ALL users, assets, and work orders for this organization.`)) {
                                                        deleteMutation.mutate(tenant.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending || tenant.slug === 'default'}
                                            >
                                                {deleteMutation.isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Quotas Dialog */}
            <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update {editingTenant?.name} Quotas</DialogTitle>
                    </DialogHeader>
                    {editingTenant && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Max Users</Label>
                                    <Input
                                        type="number"
                                        defaultValue={editingTenant.maxUsers}
                                        id="edit-max-users"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Admins</Label>
                                    <Input
                                        type="number"
                                        defaultValue={editingTenant.maxAdmins}
                                        id="edit-max-admins"
                                    />
                                </div>
                            </div>
                            <Button className="w-full" onClick={() => {
                                const maxUsers = parseInt((document.getElementById('edit-max-users') as HTMLInputElement).value);
                                const maxAdmins = parseInt((document.getElementById('edit-max-admins') as HTMLInputElement).value);
                                updateMutation.mutate({
                                    id: editingTenant.id,
                                    data: { maxUsers, maxAdmins }
                                });
                            }} disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Quotas
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
