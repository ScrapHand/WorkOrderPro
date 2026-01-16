"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { UserRole } from "@/lib/auth/types";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { UserProfileDialog } from "@/components/users/UserProfileDialog";

export function Header() {
    const { data: user } = useAuth();
    const logout = useLogout();
    const { config } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const params = useParams();
    const tenantSlug = (params?.tenantSlug as string) || 'default';

    const logoUrl = config?.branding?.logoUrl;
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6 shadow-sm">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-2 md:hidden">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px]">
                        <Sidebar onNavigate={() => setIsMobileOpen(false)} />
                    </SheetContent>
                </Sheet>
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-6 w-auto" />}
            </div>


            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
                <div className="-ml-2">
                    <ModeToggle />
                </div>

                {/* User Profile Dropdown (Simplified) */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 overflow-hidden">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span>{user?.full_name?.charAt(0) || user?.username?.charAt(0) || "U"}</span>
                            )}
                        </div>
                        <div className="hidden md:block text-sm text-left">
                            <div className="font-medium">{user?.full_name || user?.username || "User"}</div>
                            <div className="text-xs text-muted-foreground capitalize">{user?.role || "Guest"}</div>
                        </div>
                    </button>

                    {/* Simple Dropdown Content */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95 z-50">
                            <div className="px-2 py-1.5 text-sm font-semibold border-b mb-1">
                                My Account
                            </div>
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsProfileOpen(true);
                                }}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            >
                                Profile
                            </button>

                            {/* [SECURED] Master Only Links */}
                            {isSuperAdmin && (
                                <>
                                    <Link
                                        href={`/${tenantSlug}/dashboard/admin/users`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    >
                                        Admin Users
                                    </Link>
                                    <Link
                                        href={`/${tenantSlug}/dashboard/admin/tenants`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    >
                                        Tenants
                                    </Link>
                                    <Link
                                        href={`/${tenantSlug}/dashboard/admin/company`}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    >
                                        Global Settings
                                    </Link>
                                </>
                            )}

                            <div className="h-px bg-muted my-1" />
                            <button
                                onClick={() => logout.mutate()}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-destructive hover:text-destructive-foreground"
                            >
                                Log out
                            </button>
                        </div>
                    )}

                    <UserProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
                </div>
            </div>
        </header>
    );
}
