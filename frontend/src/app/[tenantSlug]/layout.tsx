"use client";
import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { TenantProvider } from '@/context/TenantContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu } from 'lucide-react';

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const tenantSlug = params.tenantSlug as string;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const isLoginPage = pathname?.includes('/login');

        if (!token && !isLoginPage) {
            console.log("TenantLayout: No token found, redirecting to login...");
            router.push(`/${tenantSlug}/login`);
        } else {
            setIsAuthChecking(false);
        }
    }, [pathname, tenantSlug, router]);

    if (isAuthChecking && !pathname?.includes('/login')) {
        return <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-white/50">Verifying session...</div>;
    }

    return (
        <TenantProvider slug={tenantSlug}>
            <ThemeProvider>
                <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
                    {/* Mobile Header */}
                    <header className="lg:hidden h-16 border-b border-[var(--color-surface-border)] bg-[#0f1115] px-4 flex items-center justify-between sticky top-0 z-30">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-muted hover:text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                <span className="text-primary font-black text-xs">WP</span>
                            </div>
                            <span className="font-bold text-sm text-white">WorkOrderPro</span>
                        </div>

                        {/* Empty div for balancing flexbox if needed, or just let it stay right aligned */}
                        <div className="w-10"></div>
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

