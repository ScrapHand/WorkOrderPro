
"use client";

import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '@/services/inventory.service';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddInventoryModal } from '@/components/inventory/AddInventoryModal';

export default function InventoryPage() {
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { data: parts, isLoading } = useQuery({
        queryKey: ["parts"],
        queryFn: InventoryService.getAll
    });

    const filteredParts = parts?.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const lowStockCount = parts?.filter(p => p.quantity <= p.minQuantity).length || 0;
    const totalValue = parts?.reduce((acc, p) => acc + (p.cost * p.quantity), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-gray-500">Manage spare parts and stock levels.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Part
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Items</p>
                        <p className="text-2xl font-bold">{parts?.length || 0}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Low Stock</p>
                        <p className="text-2xl font-bold">{lowStockCount}</p>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <span className="text-xl font-bold">$</span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Value</p>
                        <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                    </div>
                </Card>
            </div>

            {/* Search & Toolbar */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search parts by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Parts Table */}
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">Part Name</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Bin Loc</th>
                            <th className="px-6 py-3 text-right">Cost</th>
                            <th className="px-6 py-3 text-center">Qty</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading inventory...</td></tr>
                        ) : filteredParts.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No parts found.</td></tr>
                        ) : (
                            filteredParts.map(part => (
                                <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{part.name}</td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{part.sku || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500">{part.binLocation || '-'}</td>
                                    <td className="px-6 py-4 text-right">${part.cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center font-bold">
                                        {part.quantity}
                                    </td>
                                    <td className="px-6 py-4">
                                        {part.quantity <= part.minQuantity ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AddInventoryModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
        </div>
    );
}
