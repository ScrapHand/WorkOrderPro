"use client";

import { useState, use } from 'react';
import { TenantProvider } from '@/context/TenantContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu } from 'lucide-react';

export default function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = use(params);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <TenantProvider slug={tenantSlug}>
            <ThemeProvider>
                <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
                    {/* Mobile Header */}
                    <header className="lg:hidden h-16 border-b border-[var(--color-surface-border)] bg-[#0f1115] px-4 flex items-center justify-between sticky top-0 z-30">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                <span className="text-primary font-black text-xs">WP</span>
                            </div>
                            <span className="font-bold text-sm text-white">WorkOrderPro</span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-muted hover:text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </header>

                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                    <main className="flex-1 p-4 lg:p-8 bg-[var(--background)] transition-all">
                        {children}
                    </main>
                </div>
            </ThemeProvider>
        </TenantProvider>
    );
}
