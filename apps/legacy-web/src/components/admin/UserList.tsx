"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import UserModal from './UserModal';

export default function UserList() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            console.error(err);
            alert("Failed to delete user");
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-surface p-8 rounded-lg border shadow-sm animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button
                    onClick={handleAdd}
                    className="bg-[var(--color-primary)] text-white px-4 py-2 rounded text-sm hover:opacity-90 transition"
                >
                    + Add New User
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400 text-sm">
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-800 hover:bg-black/20">
                                    <td className="py-3 px-4 font-medium">{user.full_name}</td>
                                    <td className="py-3 px-4 text-gray-400">{user.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs uppercase font-bold
                                            ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                                user.role === 'manager' ? 'bg-amber-500/20 text-amber-400' :
                                                    user.role === 'engineer' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-gray-500/20 text-gray-400'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-[var(--color-primary)] hover:underline mr-4 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-500 hover:underline text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        No users found. Create one above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchUsers}
                user={editingUser}
            />
        </div>
    );
}
