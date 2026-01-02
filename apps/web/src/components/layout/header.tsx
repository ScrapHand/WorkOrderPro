"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";
import { UserRole } from "@/lib/auth/types";
import { useState } from "react";

export function Header() {
    const { data: user } = useAuth();
    const logout = useLogout();
    const { config } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const logoUrl = config?.branding?.logoUrl;

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6 shadow-sm">
            {/* Mobile Menu Trigger & Logo */}
            <div className="flex items-center gap-2 md:hidden">
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                </Button>
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-6 w-auto" />}
            </div>

            {/* Global Search */}
            <div className="w-full flex-1 md:w-auto md:flex-none">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search assets, orders..."
                        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>

                {/* User Profile Dropdown (Simplified) */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {user?.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="hidden md:block text-sm text-left">
                            <div className="font-medium">{user?.full_name || "User"}</div>
                            <div className="text-xs text-muted-foreground capitalize">{user?.role || "Guest"}</div>
                        </div>
                    </button>

                    {/* Simple Dropdown Content */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95 z-50">
                            <div className="px-2 py-1.5 text-sm font-semibold border-b mb-1">
                                My Account
                            </div>
                            <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                                Profile
                            </button>
                            <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                                Settings
                            </button>
                            <div className="h-px bg-muted my-1" />
                            <button
                                onClick={() => logout.mutate()}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-destructive hover:text-destructive-foreground"
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
