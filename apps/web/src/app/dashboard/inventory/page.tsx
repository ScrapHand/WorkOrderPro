"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryService } from "@/services/inventory.service";
import { useState } from "react";
import {
    Search,
    Plus,
    AlertTriangle,
    MoreVertical,
    Edit,
    Trash2,
    History,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: items, isLoading } = useQuery({
        queryKey: ["inventory"],
        queryFn: () => InventoryService.list(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => InventoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Item deleted");
        },
    });

    const filteredItems = items?.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory</h1>
                    <p className="text-muted-foreground">Manage spare parts, consumables, and stock levels.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </header>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search inventory..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 text-xs font-medium text-muted-foreground bg-muted p-1 rounded-lg">
                    <div className="px-3 py-1 bg-white rounded shadow-sm text-foreground">All</div>
                    <div className="px-3 py-1">Low Stock</div>
                    <div className="px-3 py-1">Out of Stock</div>
                </div>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Threshold</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-10 w-10 bg-muted animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                                    <TableCell><div className="h-6 w-20 bg-muted animate-pulse rounded-full" /></TableCell>
                                    <TableCell />
                                </TableRow>
                            ))
                        ) : filteredItems?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Package className="h-12 w-12 mb-2" />
                                        <p>No items found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems?.map((item) => {
                                const isLow = item.quantity <= item.threshold;
                                const isOut = item.quantity === 0;

                                return (
                                    <TableRow key={item.id} className="group hover:bg-muted/30">
                                        <TableCell>
                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-muted-foreground/30" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.locationId || "Main Store"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`font-mono font-bold ${isLow ? 'text-red-600' : ''}`}>
                                                {item.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.threshold}
                                        </TableCell>
                                        <TableCell>
                                            {isOut ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    Out of Stock
                                                </Badge>
                                            ) : isLow ? (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Low Stock
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                                    Healthy
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-red-50"
                                                    onClick={() => {
                                                        if (confirm("Confirm deletion?")) deleteMutation.mutate(item.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

