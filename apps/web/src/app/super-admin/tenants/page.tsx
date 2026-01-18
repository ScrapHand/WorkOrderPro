
"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminService, TenantSummary } from '@/services/super-admin.service';
import {
    Search,
    Filter,
    MoreVertical,
    ShieldCheck,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
    ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TenantExplorer() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data: tenants, isLoading } = useQuery<TenantSummary[]>({
        queryKey: ['super-admin-tenants'],
        queryFn: () => SuperAdminService.getTenants()
    });

    const provisionMutation = useMutation({
        mutationFn: ({ id, features }: { id: string, features: any }) =>
            SuperAdminService.provision(id, features),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
            toast.success('Tenant features updated successfully');
        }
    });

    const toggleFeature = (tenant: TenantSummary, featureKey: string) => {
        const currentFeatures = tenant.features || {};
        const newFeatures = {
            ...currentFeatures,
            [featureKey]: !currentFeatures[featureKey]
        };
        provisionMutation.mutate({ id: tenant.id, features: newFeatures });
    };

    const filteredTenants = tenants?.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableFeatures = [
        { key: 'factoryLayout', label: 'Factory Layout Visualizer' },
        { key: 'inventoryIntelligence', label: 'Inventory Intelligence' },
        { key: 'shiftAnalytics', label: 'Shift Performance Analytics' },
        { key: 'autoDispatch', label: 'Automated Job Dispatch' },
        { key: 'assetTelemetry', label: 'Advanced Asset Telemetry' },
        { key: 'safetySignOffs', label: 'Safety Sign-offs' },
        { key: 'workOrderSLA', label: 'Work Order SLAs' },
        { key: 'vendorPortal', label: 'Vendor Portal' },
        { key: 'costAnalytics', label: 'Cost Analytics' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tenant Explorer</h1>
                    <p className="text-gray-500 text-sm">Manage company lifecycles and feature entitlements.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Find organization..."
                            className="pl-10 w-full sm:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter size={18} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Provisioned Features</TableHead>
                            <TableHead className="text-center">Users</TableHead>
                            <TableHead className="text-center">Jobs</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} className="h-16 animate-pulse bg-gray-50/50" />
                                </TableRow>
                            ))
                        ) : filteredTenants?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    No organizations found matching "{searchTerm}"
                                </TableCell>
                            </TableRow>
                        ) : filteredTenants?.map((tenant) => (
                            <TableRow key={tenant.id} className="hover:bg-gray-50/50 transition-colors group">
                                <TableCell>
                                    <div>
                                        <p className="font-semibold text-gray-900">{tenant.name}</p>
                                        <p className="text-xs text-gray-400 font-mono italic">/{tenant.slug}</p>
                                    </div>
                                    <Badge variant="secondary" className="mt-1 text-[10px] uppercase font-bold tracking-wider">
                                        {tenant.plan} PLAN
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                    <div className="flex flex-wrap gap-1">
                                        {availableFeatures.map(f => {
                                            const isEnabled = tenant.features?.[f.key];
                                            return (
                                                <button
                                                    key={f.key}
                                                    onClick={() => toggleFeature(tenant, f.key)}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-all ${isEnabled
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-200'
                                                        : 'bg-gray-50 text-gray-400 border-gray-100 opacity-60 grayscale'
                                                        }`}
                                                >
                                                    {isEnabled ? <ToggleRight size={10} /> : <ToggleLeft size={10} />}
                                                    {f.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-medium">{tenant._count.users}</TableCell>
                                <TableCell className="text-center font-medium">{tenant._count.workOrders}</TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {format(new Date(tenant.createdAt), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical size={18} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem className="gap-2">
                                                <ShieldCheck size={16} /> Update Plan
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 cursor-pointer font-bold text-indigo-600"
                                                onClick={() => router.push(`/${tenant.slug}/dashboard`)}
                                            >
                                                <ExternalLink size={16} /> Enter Organization
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 text-destructive">
                                                Suspend Organization
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
