"use client";
import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { TenantProvider } from '@/context/TenantContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';

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
                    <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

                    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                    <main className="flex-1 p-4 lg:p-8 bg-[var(--background)] transition-all">
                        {children}
                    </main>
                </div>
            </ThemeProvider>
        </TenantProvider>
    );
}

