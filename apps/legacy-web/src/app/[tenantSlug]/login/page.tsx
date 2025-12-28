"use client";

import React, { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { api, setAuthToken, resolveBackendUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { tenant } = useTenant();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const res = await api.post('/auth/login', formData);

            setAuthToken(res.data.access_token);
            // redirect to dashboard
            router.push(`/${tenant?.slug}/dashboard`);
        } catch (err: any) {
            setError("Login failed");
            console.error(err);
        }
    };

    const logoUrl = tenant?.theme_json?.branding?.logoUrl;

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg border bg-surface p-8 shadow-sm text-center">
                <div className="mb-6 flex justify-center">
                    {logoUrl ? (
                        <img src={resolveBackendUrl(logoUrl) || ""} alt={tenant?.name} className="h-12 object-contain" />
                    ) : (
                        <h1 className="text-2xl font-bold">{tenant?.name || "Login"}</h1>
                    )}
                </div>
                {error && <div className="mb-4 text-red-500">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border p-2 bg-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border p-2 bg-transparent"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-white hover:opacity-90"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
