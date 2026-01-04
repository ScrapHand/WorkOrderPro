"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    ClipboardList,
    Box,
    Wrench,
    Users,
    PlusCircle,
    Settings,
    LogOut,
    Lock,
    Archive,
    Network,
    TrendingUp
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";
import { useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";

// Helper to prefix links
const getSidebarLinks = (term: any, slug: string) => {
    const prefix = `/${slug}/dashboard`;
    return [
        { name: "Dashboard", href: prefix, icon: LayoutDashboard },
        { name: "Analytics", href: `${prefix}/analytics`, icon: TrendingUp },
        { name: term?.workOrders || "Work Orders", href: `${prefix}/work-orders`, icon: ClipboardList },
        { name: `Archived ${term?.workOrders || "Jobs"}`, href: `${prefix}/work-orders/archive`, icon: Archive },
        { name: term?.assets || "Assets", href: `${prefix}/assets`, icon: Box },
        { name: `${term?.assets || "Asset"} Hierarchy`, href: `${prefix}/assets/tree`, icon: Network },
        { name: term?.inventory || "Inventory", href: `${prefix}/inventory`, icon: Wrench },
        { name: term?.reports || "Reports", href: `${prefix}/reports`, icon: ClipboardList },
    ];
};

const adminLinksPrefix = (slug: string) => {
    const prefix = `/${slug}/dashboard/admin`;
    return [
        { name: "User Management", href: `${prefix}/users`, icon: Users },
        { name: "Company Actions", href: `${prefix}/company`, icon: Settings },
        { name: "Role Management", href: `${prefix}/roles`, icon: Lock },
        { name: "Secrets & Config", href: `${prefix}/secrets`, icon: Lock },
        { name: "System Doctor", href: `/${slug}/dashboard/system-status`, icon: Settings },
    ];
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';
    const logout = useLogout();
    const { config } = useTheme();

    const logoUrl = config?.branding?.logoUrl;

    const links = getSidebarLinks(config?.branding?.terminology, tenantSlug);
    const adminLinks = adminLinksPrefix(tenantSlug);
    const b = config?.branding;

    const handleLinkClick = () => {
        if (onNavigate) onNavigate();
    };

    return (
        <div
            className="flex h-full w-full flex-col border-r backdrop-blur supports-[backdrop-filter]:bg-background/60"
            style={{
                backgroundColor: b?.mutedColor || undefined,
                color: b?.textColor || undefined,
                borderColor: b?.secondaryColor ? `${b.secondaryColor}40` : undefined
            }}
        >
            {/* Branding */}
            <div className="flex h-14 items-center border-b px-6" style={{ borderColor: b?.secondaryColor ? `${b.secondaryColor}40` : undefined }}>
                <Link href={`/${tenantSlug}/dashboard`} className="flex items-center gap-2 font-semibold" onClick={handleLinkClick}>
                    {/* Logo or Icon */}
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                    ) : (
                        <Wrench className="h-6 w-6" />
                    )}
                    <span className="truncate">{config?.branding?.appName || "WorkOrderPro"}</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} onClick={handleLinkClick}>
                            <Button
                                variant={pathname === link.href ? "default" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    pathname === link.href ? "" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.name}
                            </Button>
                        </Link>
                    ))}

                    {/* Admin Section */}
                    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                        <div className="mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
                            Administration
                        </div>
                        {adminLinks.map((link) => (
                            <Link key={link.href} href={link.href} onClick={handleLinkClick}>
                                <Button
                                    variant={pathname === link.href ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3",
                                        pathname === link.href ? "" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.name}
                                </Button>
                            </Link>
                        ))}
                    </RoleGuard>
                </nav>
            </div>

            {/* Sticky Footer / Big Button */}
            <div className="border-t p-4 space-y-2">
                <Link href={`/${tenantSlug}/dashboard/work-orders/new`} onClick={handleLinkClick}>
                    <Button size="lg" className="w-full gap-2 shadow-lg">
                        <PlusCircle className="h-5 w-5" /> Create Work Order
                    </Button>
                </Link>

                <Button
                    variant="outline"
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        logout.mutate();
                        handleLinkClick();
                    }}
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </div>
        </div>
    );
}
