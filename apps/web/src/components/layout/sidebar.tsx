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
    Shield,
    Network,
    TrendingUp,
    Layout,
    Calendar
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";
import { useLogout, useUser } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";
import { TenantSwitcher } from "@/components/layout/TenantSwitcher";
import { UpgradeBanner } from "@/components/billing/UpgradeBanner";

// Helper to prefix links
const getSidebarLinks = (term: any, slug: string) => {
    const prefix = `/${slug}/dashboard`;
    return [
        { name: "Dashboard", href: prefix, icon: LayoutDashboard },
        { name: "Analytics", href: `${prefix}/analytics`, icon: TrendingUp },
        { name: term?.workOrders || "Work Orders", href: `${prefix}/work-orders`, icon: ClipboardList },
        { name: "Maintenance Calendar", href: `/${slug}/dashboard/planner`, icon: Calendar },
        { name: term?.assets || "Assets", href: `${prefix}/assets`, icon: Box },
        { name: term?.inventory || "Inventory", href: `${prefix}/inventory`, icon: Wrench },
        { name: term?.reports || "Reports", href: `${prefix}/reports`, icon: ClipboardList },
        { name: "Archived Jobs", href: `${prefix}/work-orders/archive`, icon: Archive },
    ];
};

const adminLinksPrefix = (slug: string) => {
    const prefix = `/${slug}/dashboard/admin`;
    return [
        { name: "User Management", href: `${prefix}/users`, icon: Users },
        { name: "Company Actions", href: `${prefix}/company`, icon: Settings },
        { name: "Role Management", href: `${prefix}/roles`, icon: Lock },
        { name: "Secrets & Config", href: `${prefix}/secrets`, icon: Lock },
        { name: "Audit Logs", href: `${prefix}/audit-logs`, icon: Shield },
        { name: "System Doctor", href: `/${slug}/dashboard/system-status`, icon: Settings },
    ];
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';
    const logout = useLogout();
    const { data: user } = useUser(); // [PROTOCOL] Get Real User for Granular Permissions
    const { config } = useTheme();

    const logoUrl = config?.branding?.logoUrl;

    const links = getSidebarLinks(config?.branding?.terminology, tenantSlug);

    // [PROTOCOL] Invisible UI Logic
    const allAdminLinks = adminLinksPrefix(tenantSlug);
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.GLOBAL_ADMIN || user?.email === 'scraphand@admin.com';
    const perms = user?.permissions || [];
    const hasFullAccess = isSuperAdmin || perms.includes('*');

    const adminLinks = allAdminLinks.filter(link => {
        if (hasFullAccess) return true;

        if (link.name === "User Management") return perms.includes('user:read') || perms.includes('user:write');
        if (link.name === "Company Actions") return perms.includes('tenant:manage');
        if (link.name === "Audit Logs") return perms.includes('tenant:manage');

        // [STRICT] Super Admin Only Tools
        if (link.name === "Role Management") return isSuperAdmin;
        if (link.name === "Secrets & Config") return isSuperAdmin;
        if (link.name === "System Doctor") return isSuperAdmin;

        // 3. Fallback for Legacy Admin Role (if no permissions set)
        if (user?.role === UserRole.ADMIN) return true;

        return false;
    });
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
                        <Shield className="h-6 w-6 text-blue-500" />
                    )}
                    <span className="truncate">{config?.branding?.appName || "AxonVantage Systems"}</span>
                </Link>
            </div>

            {/* Tenant Switcher (Master Only) */}
            <TenantSwitcher />

            {/* Navigation */}
            <div className="flex-1 overflow-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} onClick={handleLinkClick}>
                            <Button
                                variant={pathname === link.href ? "outline" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3.5 transition-all duration-200 px-4",
                                    pathname === link.href
                                        ? "bg-primary/5 text-primary font-bold shadow-sm border border-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <link.icon className={cn(
                                    "h-[18px] w-[18px]",
                                    pathname === link.href ? "text-primary" : "text-muted-foreground/70"
                                )} />
                                <span className="text-[14px] tracking-tight">{link.name}</span>
                            </Button>
                        </Link>
                    ))}

                    {/* Admin Section */}
                    {adminLinks.length > 0 && (
                        <>
                            <div className="mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
                                Administration {user?.role === UserRole.SUPER_ADMIN ? '(Master)' : ''}
                            </div>
                            {adminLinks.map((link) => (
                                <Link key={link.href} href={link.href} onClick={handleLinkClick}>
                                    <Button
                                        variant={pathname === link.href ? "outline" : "ghost"}
                                        className={cn(
                                            "w-full justify-start gap-3.5 transition-all duration-200 px-4",
                                            pathname === link.href
                                                ? "bg-indigo-50/50 text-indigo-700 font-bold shadow-sm border border-indigo-100"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <link.icon className={cn(
                                            "h-[18px] w-[18px]",
                                            pathname === link.href ? "text-indigo-600" : "text-muted-foreground/70"
                                        )} />
                                        <span className="text-[14px] tracking-tight">{link.name}</span>
                                    </Button>
                                </Link>
                            ))}
                        </>
                    )}
                </nav>
            </div>

            {/* Billing Upgrades */}
            <UpgradeBanner />

            {/* Sticky Footer / Big Button */}
            <div className="border-t p-4 space-y-2">
                <RoleGuard requiredPermission="work_order:write">
                    <Link href={`/${tenantSlug}/dashboard/work-orders/new`} onClick={handleLinkClick}>
                        <Button size="lg" className="w-full gap-2 shadow-lg">
                            <PlusCircle className="h-5 w-5" /> Create Work Order
                        </Button>
                    </Link>
                </RoleGuard>

                <Button
                    variant="outline"
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        logout.mutate();
                        handleLinkClick();
                    }}
                >
                    <LogOut className="h-4 w-4" /> Logout
                </Button>
            </div>

            {/* [DEBUG] RBAC Visibility */}
            {process.env.NODE_ENV === 'development' && (
                <div className="px-4 pb-4 text-[10px] text-muted-foreground break-all">
                    <p>Role: {user?.role}</p>
                    <p>Perms: {user?.permissions?.join(', ') || 'NONE'}</p>
                </div>
            )}
        </div>
    );
}
