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
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const { data: items, isLoading } = useQuery({
        queryKey: ["inventory"],
        queryFn: InventoryService.list
    });

    const deleteMutation = useMutation({
        mutationFn: InventoryService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Item deleted");
        }
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
                <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </header>

            {/* Existing Search Bar ... */}

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Location</TableHead> {/* New Column */}
                            <TableHead>Supplier</TableHead> {/* New Column */}
                            <TableHead>Quantity</TableHead>
                            <TableHead>Threshold</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* ... loading state ... */}

                        {/* ... empty state ... */}

                        {filteredItems?.map((item) => {
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
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {item.locationId || "-"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {item.supplierInfo ? (
                                            <div className="flex flex-col">
                                                <span>{item.supplierInfo.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{item.supplierInfo.contact}</span>
                                            </div>
                                        ) : "-"}
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
                                        {/* Actions */}
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsAddOpen(true);
                                                }}
                                            >
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
                        })}
                    </TableBody>
                </Table>
            </div>

            <AddInventoryModal
                open={isAddOpen}
                onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) setSelectedItem(null);
                }}
                initialData={selectedItem}
            />
        </div>
    );
}

