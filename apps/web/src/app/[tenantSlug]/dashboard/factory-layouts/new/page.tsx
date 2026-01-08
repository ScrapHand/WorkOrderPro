"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewFactoryLayoutPage() {
    const router = useRouter();
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            const res = await fetch('/api/v1/factory-layouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create layout');
            return res.json();
        },
        onSuccess: (data) => {
            toast.success('Layout created successfully');
            router.push(`/${tenantSlug}/dashboard/factory-layouts/${data.id}`);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        createMutation.mutate({ name, description });
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/${tenantSlug}/dashboard/factory-layouts`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Factory Layout</h1>
                    <p className="text-muted-foreground">Set up a new visual factory floor map</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Layout Name *
                    </label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Production Floor A"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Description
                    </label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional description of this layout"
                        rows={3}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        type="submit"
                        disabled={createMutation.isPending}
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create Layout'}
                    </Button>
                    <Link href={`/${tenantSlug}/dashboard/factory-layouts`}>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}
