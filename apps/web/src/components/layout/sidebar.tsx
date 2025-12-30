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
    Settings
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/lib/auth/types";

const sidebarLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Work Orders", href: "/work-orders", icon: ClipboardList },
    { name: "Assets", href: "/assets", icon: Box },
    { name: "Inventory", href: "/inventory", icon: Wrench },
];

const adminLinks = [
    { name: "User Management", href: "/admin/users", icon: Users },
    //    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Branding */}
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <span className="text-primary">WorkOrder</span>Pro
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
            <div className="border-t p-4">
                <Link href="/work-orders/new">
                    <Button size="lg" className="w-full gap-2 shadow-lg">
                        <PlusCircle className="h-5 w-5" /> Create Work Order
                    </Button>
                </Link>
            </div>
        </div>
    );
}
