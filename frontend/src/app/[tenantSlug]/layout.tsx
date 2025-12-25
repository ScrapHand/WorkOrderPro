import { TenantProvider } from '@/context/TenantContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <TenantProvider slug={tenantSlug}>
            <ThemeProvider>
                <div className="min-h-screen bg-background text-foreground flex">
                    <Sidebar />
                    <div className="flex-1 p-8 bg-[var(--background)]">
                        {children}
                    </div>
                </div>
            </ThemeProvider>
        </TenantProvider>
    );
}
