
"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuperAdminService } from '@/services/super-admin.service';
import {
    Search,
    MoreVertical,
    UserMinus,
    Mail,
    Calendar,
    Activity
} from 'lucide-react';
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

export default function GlobalUserDirectory() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['super-admin-users', searchTerm],
        queryFn: () => SuperAdminService.getUsers(searchTerm)
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => SuperAdminService.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
            toast.success('User removed from platform');
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Global User Directory</h1>
                    <p className="text-gray-500 text-sm">Oversee all technicians and admins across the ecosystem.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search email or name..."
                        className="pl-10 w-full sm:w-[350px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>User / Organization</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead className="text-right">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="h-20 animate-pulse bg-gray-50/50" />
                                </TableRow>
                            ))
                        ) : users?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : users?.map((user: any) => (
                            <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm border-2 border-white">
                                            {user.username?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{user.username || 'No Name Set'}</p>
                                            <p className="text-xs text-blue-600 font-medium">@{user.tenant.slug}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`font-semibold ${user.role === 'SUPER_ADMIN' ? 'border-red-200 text-red-700 bg-red-50' : ''}`}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Status</span>
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                                <Activity size={12} /> Active
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical size={18} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem className="gap-2">
                                                Impersonate User
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2">
                                                Change Password
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="gap-2 text-destructive"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this user?')) {
                                                        deleteMutation.mutate(user.id);
                                                    }
                                                }}
                                            >
                                                <UserMinus size={16} /> Delete User
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
