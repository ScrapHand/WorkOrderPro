"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ConveyorSystem {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface ConveyorSystemPanelProps {
    onClose?: () => void;
    selectedEdgeId?: string;
    onAssignToEdge?: (systemId: string | null) => void;
}

const DEFAULT_COLORS = [
    '#6366f1', // Indigo
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

export function ConveyorSystemPanel({
    onClose,
    selectedEdgeId,
    onAssignToEdge
}: ConveyorSystemPanelProps) {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newSystemName, setNewSystemName] = useState('');
    const [newSystemColor, setNewSystemColor] = useState(DEFAULT_COLORS[0]);
    const [newSystemDescription, setNewSystemDescription] = useState('');

    const { data: systems, isLoading } = useQuery<ConveyorSystem[]>({
        queryKey: ['conveyor-systems'],
        queryFn: async () => {
            const res = await fetch('/api/v1/conveyor-systems', {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch conveyor systems');
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; color: string; description?: string }) => {
            const res = await fetch('/api/v1/conveyor-systems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create conveyor system');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conveyor-systems'] });
            toast.success('Conveyor system created');
            setIsCreating(false);
            setNewSystemName('');
            setNewSystemDescription('');
            setNewSystemColor(DEFAULT_COLORS[0]);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/v1/conveyor-systems/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to delete conveyor system');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conveyor-systems'] });
            toast.success('Conveyor system deleted');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleCreate = () => {
        if (!newSystemName.trim()) {
            toast.error('System name is required');
            return;
        }
        createMutation.mutate({
            name: newSystemName,
            color: newSystemColor,
            description: newSystemDescription,
        });
    };

    return (
        <div className="absolute right-4 top-20 bottom-4 w-80 bg-white border rounded-lg shadow-lg z-10 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Conveyor Systems</h3>
                {onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* System List */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
                {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading systems...</div>
                ) : systems && systems.length > 0 ? (
                    systems.map((system) => (
                        <div
                            key={system.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Circle
                                        className="w-4 h-4 flex-shrink-0"
                                        fill={system.color}
                                        stroke={system.color}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            {system.name}
                                        </div>
                                        {system.description && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                {system.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {selectedEdgeId && onAssignToEdge && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onAssignToEdge(system.id)}
                                            className="h-7 text-xs"
                                        >
                                            Assign
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(system.id)}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                        No conveyor systems yet
                    </div>
                )}

                {selectedEdgeId && onAssignToEdge && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAssignToEdge(null)}
                        className="w-full"
                    >
                        Clear Assignment
                    </Button>
                )}
            </div>

            {/* Create Form */}
            {isCreating ? (
                <div className="p-4 border-t space-y-3 bg-gray-50">
                    <div>
                        <Label htmlFor="system-name" className="text-xs">Name *</Label>
                        <Input
                            id="system-name"
                            value={newSystemName}
                            onChange={(e) => setNewSystemName(e.target.value)}
                            placeholder="e.g., Main Line"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="system-description" className="text-xs">Description</Label>
                        <Input
                            id="system-description"
                            value={newSystemDescription}
                            onChange={(e) => setNewSystemDescription(e.target.value)}
                            placeholder="Optional"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Color</Label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {DEFAULT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewSystemColor(color)}
                                    className={`w-8 h-8 rounded border-2 transition-all ${newSystemColor === color
                                            ? 'border-gray-900 scale-110'
                                            : 'border-gray-300'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                            className="flex-1"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setIsCreating(false);
                                setNewSystemName('');
                                setNewSystemDescription('');
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-4 border-t">
                    <Button
                        size="sm"
                        onClick={() => setIsCreating(true)}
                        className="w-full gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Conveyor System
                    </Button>
                </div>
            )}

            <div className="px-4 pb-3 text-xs text-muted-foreground">
                Color-code edge connections by grouping them into systems
            </div>
        </div>
    );
}
