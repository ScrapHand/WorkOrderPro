"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService } from '@/services/inventory.service';
import { AdminService } from '@/services/admin.service';
import { Plus, Search, AlertTriangle, Package, Trash2, Edit, History, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddInventoryModal } from '@/components/inventory/AddInventoryModal';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from '@/components/auth/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

export default function InventoryPage() {
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const { data: user } = useAuth();

    const { data: parts, isLoading } = useQuery({
        queryKey: ["parts"],
        queryFn: InventoryService.getAll
    });

    const { data: transactions, isLoading: isTransLoading } = useQuery({
        queryKey: ["inventory-transactions"],
        queryFn: InventoryService.getTransactions
    });

    const { data: config } = useQuery({
        queryKey: ["tenant-config"],
        queryFn: AdminService.getConfig
    });

    const currencySymbol = config?.currency === 'USD' ? '$' : config?.currency === 'EUR' ? '€' : '£';

    const deletePart = useMutation({
        mutationFn: InventoryService.delete,
        onSuccess: () => {
            toast.success("Part deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["parts"] });
        },
        onError: () => {
            toast.error("Failed to delete part");
        }
    });

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this part? This action cannot be undone.")) {
            deletePart.mutate(id);
        }
    };

    const filteredParts = useMemo(() => parts?.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    ) || [], [parts, search]);

    const lowStockCount = parts?.filter(p => p.quantity <= p.minQuantity).length || 0;
    const totalValue = parts?.reduce((acc, p) => acc + (p.cost * p.quantity), 0) || 0;

    const [editingPart, setEditingPart] = useState<any>(null);

    const handleEdit = (part: any) => {
        setEditingPart(part);
        setIsAddModalOpen(true);
    };

    const canWrite = user?.permissions?.includes('inventory:write') || user?.permissions?.includes('*') || user?.role === 'SUPER_ADMIN';
    const canDelete = user?.permissions?.includes('inventory:delete') || user?.permissions?.includes('*') || user?.role === 'SUPER_ADMIN';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-gray-500">Manage spare parts and stock levels.</p>
                </div>
                <div className="flex gap-2">
                    <RoleGuard requiredPermission="inventory:write">
                        <Button onClick={() => { setEditingPart(null); setIsAddModalOpen(true); }} className="gap-2 shadow-sm">
                            <Plus className="w-4 h-4" /> Add Part
                        </Button>
                    </RoleGuard>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4 bg-white/50 backdrop-blur border-slate-200/60 shadow-sm">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</p>
                        <p className="text-2xl font-black text-slate-900">{parts?.length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 bg-white/50 backdrop-blur border-slate-200/60 shadow-sm">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock</p>
                        <p className="text-2xl font-black text-slate-900">{lowStockCount}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4 bg-white/50 backdrop-blur border-slate-200/60 shadow-sm">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <span className="text-xl font-bold">{currencySymbol}</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Value</p>
                        <p className="text-2xl font-black text-slate-900">{currencySymbol}{totalValue.toLocaleString()}</p>
                    </div>
                </Card>
            </div>

            <Tabs defaultValue="stock" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-4">
                    <TabsTrigger value="stock" className="gap-2">
                        <Package className="w-4 h-4" /> Current Stock
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="w-4 h-4" /> History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="stock" className="space-y-4">
                    {/* Search & Toolbar */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search parts by name or SKU..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Parts Table */}
                    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Part Name</th>
                                    <th className="px-6 py-4 hidden md:table-cell uppercase">SKU</th>
                                    <th className="px-6 py-4 hidden md:table-cell uppercase">Bin Loc</th>
                                    <th className="px-6 py-4 text-right hidden lg:table-cell uppercase">Cost</th>
                                    <th className="px-6 py-4 text-center uppercase">Qty</th>
                                    <th className="px-6 py-4 hidden sm:table-cell uppercase">Status</th>
                                    {(canWrite || canDelete) && <th className="px-6 py-4 text-right uppercase">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-6 py-4 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                                            <td className="px-6 py-4 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-6 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                            <td className="px-6 py-4 flex justify-center"><Skeleton className="h-4 w-8" /></td>
                                            <td className="px-6 py-4 hidden sm:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filteredParts.length === 0 ? (
                                    <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No parts found.</td></tr>
                                ) : (
                                    filteredParts.map(part => (
                                        <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                <div>{part.name}</div>
                                                <div className="md:hidden text-xs font-normal text-slate-400 mt-1">
                                                    {part.sku && <span>SKU: {part.sku}</span>}
                                                    {part.binLocation && <span className="ml-2">Bin: {part.binLocation}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs hidden md:table-cell">{part.sku || '-'}</td>
                                            <td className="px-6 py-4 text-slate-500 hidden md:table-cell">{part.binLocation || '-'}</td>
                                            <td className="px-6 py-4 text-right hidden lg:table-cell text-slate-600">{currencySymbol}{part.cost.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-900">
                                                {part.quantity}
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                {part.quantity <= part.minQuantity ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-100">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-700 border border-green-100">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            {(canWrite || canDelete) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {canWrite && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => handleEdit(part)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {canDelete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDelete(part.id)}
                                                                disabled={deletePart.isPending}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Part</th>
                                    <th className="px-6 py-4 text-right">Change</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Performed By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60">
                                {isTransLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        </tr>
                                    ))
                                ) : transactions?.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">No transactions recorded yet.</td></tr>
                                ) : (
                                    transactions?.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {format(new Date(t.performedAt), 'MMM d, HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {t.type === 'IN' ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                                                        <ArrowDownLeft className="w-3 h-3" /> Restock
                                                    </span>
                                                ) : t.type === 'OUT' ? (
                                                    <span className="inline-flex items-center gap-1 text-orange-600 font-bold text-[10px] uppercase">
                                                        <ArrowUpRight className="w-3 h-3" /> Withdrawal
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-600 font-bold text-[10px] uppercase">
                                                        <ShieldCheck className="w-3 h-3" /> Audit
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {t.part?.name} <span className="font-mono text-[10px] text-slate-400 font-normal ml-1">{t.part?.sku}</span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black ${t.changeQuantity > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                {t.changeQuantity > 0 ? '+' : ''}{t.changeQuantity}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 italic text-xs">
                                                {t.reason || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 font-medium">
                                                {t.performedBy || 'System'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>

            <AddInventoryModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                partToEdit={editingPart}
            />
        </div>
    );
}
