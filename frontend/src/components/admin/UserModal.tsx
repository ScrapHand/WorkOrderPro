"use client";
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    user?: any; // If set, editing
}

export default function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        role: "viewer",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || "",
                email: user.email || "",
                role: user.role || "viewer",
                password: "" // Keep empty for edit
            });
        } else {
            setFormData({ full_name: "", email: "", role: "viewer", password: "" });
        }
        setError("");
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload: any = { ...formData };
            if (!payload.password && user) delete payload.password; // Don't send empty password on edit

            if (user) {
                // Update
                // Remove email if not needed or handle immutable
                await api.put(`/users/${user.id}`, payload);
            } else {
                // Create
                await api.post('/users/', payload);
            }
            onSave();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || "Failed to save user");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold mb-4">{user ? "Edit User" : "Add New User"}</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/20 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            // disabled={!!user} // Optional: Lock email on edit
                            className="w-full bg-black/20 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                        <select
                            className="w-full bg-black/20 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="viewer">Viewer</option>
                            <option value="engineer">Engineer</option>
                            <option value="manager">Team Leader</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {user ? "New Password (leave blank to keep)" : "Password"}
                        </label>
                        <input
                            type="password"
                            required={!user}
                            minLength={6}
                            className="w-full bg-black/20 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-primary)]"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
