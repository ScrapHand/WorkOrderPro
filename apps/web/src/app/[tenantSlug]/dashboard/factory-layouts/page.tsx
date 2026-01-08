"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lock, Unlock, Trash2, Layout, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/role-guard";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface FactoryLayout {
    id: string;
    name: string;
    description?: string;
    isLocked: boolean;
    version: number;
    updatedAt: string;
}

export default function FactoryLayoutsPage() {
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';
    const queryClient = useQueryClient();

    const { data: layouts, isLoading } = useQuery<FactoryLayout[]>({
        queryKey: ['factory-layouts'],
        queryFn: async () => {
            const res = await fetch('/api/v1/factory-layouts', {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch layouts');
            return res.json();
        }
    });

    const deleteLayoutMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/v1/factory-layouts/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to delete layout');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['factory-layouts'] });
            toast.success('Layout deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading layouts...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Factory Layouts
                    </h1>
                    <p className="text-muted-foreground">
                        Visual factory floor maps and production line designs
                    </p>
                </div>
                <RoleGuard requiredRole="TENANT_ADMIN">
                    <Link href={`/${tenantSlug}/dashboard/factory-layouts/new`}>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Layout
                        </Button>
                    </Link>
                </RoleGuard>
            </header>

            {!layouts || layouts.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Layout className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">No layouts yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Create your first factory layout to visualize your production flow
                            </p>
                        </div>
                        <RoleGuard requiredRole="TENANT_ADMIN">
                            <Link href={`/${tenantSlug}/dashboard/factory-layouts/new`}>
                                <Button>Create First Layout</Button>
                            </Link>
                        </RoleGuard>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {layouts.map((layout) => (
                        <Card key={layout.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Link
                                        href={`/${tenantSlug}/dashboard/factory-layouts/${layout.id}`}
                                        className="flex-1"
                                    >
                                        <CardTitle className="hover:text-blue-600 transition-colors cursor-pointer">
                                            {layout.name}
                                        </CardTitle>
                                    </Link>
                                    {layout.isLocked && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Lock className="w-3 h-3" />
                                            Locked
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>
                                    {layout.description || 'No description'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                            {formatDistanceToNow(new Date(layout.updatedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <RoleGuard requiredRole="TENANT_ADMIN">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteLayoutMutation.mutate(layout.id)}
                                            disabled={deleteLayoutMutation.isPending}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </RoleGuard>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
