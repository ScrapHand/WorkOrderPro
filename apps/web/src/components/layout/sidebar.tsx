"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    Network
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";
import { useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";

const sidebarLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Work Orders", href: "/dashboard/work-orders", icon: ClipboardList },
    { name: "Archived Jobs", href: "/dashboard/work-orders/archive", icon: Archive }, // [NEW] Archive
    { name: "Assets", href: "/dashboard/assets", icon: Box },
    { name: "Hierarchy Tree", href: "/dashboard/assets/tree", icon: Network }, // Renamed from Asset Tree and Icon updated
    { name: "Inventory", href: "/dashboard/inventory", icon: Wrench },
    { name: "Reports", href: "/dashboard/reports", icon: ClipboardList },
];

const adminLinks = [
    { name: "User Management", href: "/dashboard/admin/users", icon: Users },
    { name: "Company Actions", href: "/dashboard/admin/company", icon: Settings }, // Updated from Branding
    { name: "Role Management", href: "/dashboard/admin/roles", icon: Lock }, // Added RBAC
    { name: "Secrets & Config", href: "/dashboard/admin/secrets", icon: Lock }, // Added Secrets
    { name: "System Doctor", href: "/dashboard/system-status", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const logout = useLogout();
    const { config } = useTheme(); // Use Theme Context for Logo

    const logoUrl = config?.branding?.logoUrl;

    return (
        <div className="flex h-full w-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Branding */}
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
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
                    {sidebarLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
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
                            <Link key={link.href} href={link.href}>
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
                <Link href="/dashboard/work-orders/new">
                    <Button size="lg" className="w-full gap-2 shadow-lg">
                        <PlusCircle className="h-5 w-5" /> Create Work Order
                    </Button>
                </Link>

                <Button
                    variant="outline"
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => logout.mutate()}
                >
                    <LogOut className="h-4 w-4" /> Sign Out
                </Button>
            </div>
        </div>
    );
}
