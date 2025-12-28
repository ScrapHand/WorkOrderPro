"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/context/TenantContext';
import { resolveBackendUrl } from '@/lib/api';
import {
    LayoutDashboard,
    ClipboardList,
    CalendarClock,
    Box,
    Package,
    Settings,
    ShieldCheck,
    Archive,
    X
} from 'lucide-react';
import { BrandingLogo } from './BrandingLogo';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { tenant, user, isLoading } = useTenant();
    const pathname = usePathname();
    const naming = tenant?.theme_json?.naming;
    const slug = tenant?.slug || 'demo';
    const links = [
        { label: naming?.dashboardLabel || 'Dashboard', href: `/${slug}/dashboard`, icon: LayoutDashboard },
        { label: naming?.workOrdersLabel || 'Work Orders', href: `/${slug}/work-orders`, icon: ClipboardList },
        { label: 'Reports', href: `/${slug}/reports`, icon: LayoutDashboard }, // Re-using icon for now
        { label: 'Archives', href: `/${slug}/archives`, icon: Archive },
        { label: naming?.pmLabel || 'PM Schedule', href: `/${slug}/pm-schedule`, icon: CalendarClock },
        { label: naming?.assetsLabel || 'Assets', href: `/${slug}/assets`, icon: Box },
        { label: naming?.inventoryLabel || 'Inventory', href: `/${slug}/inventory`, icon: Package },
        { label: 'Admin', href: `/${slug}/admin`, icon: Settings },
    ];

    const role = user?.role || "";

    const filteredLinks = links.filter(link => {
        if (!role) return false; // Loading or error
        if (role === 'admin') return true;

        // Hide Admin from everyone else
        if (link.label === 'Admin') return false;

        if (role === 'manager') return true; // Manager sees everything except Admin

        if (role === 'team_leader') {
            // Team Leader: Dashboard & Work Orders ONLY
            return ['Dashboard', naming?.dashboardLabel, 'Work Orders', naming?.workOrdersLabel].includes(link.label);
        }

        if (role === 'engineer') {
            // Engineer: Everything except Admin (and naturally reports might be hidden if requested, but requirement said "all features except deleting assets")
            // Re-reading: "Engineers can use all features on all pages except for deleting" -> So they see everything.
            return true;
        }

        return true;
    });

    const logoUrl = tenant?.theme_json?.branding?.logoUrl;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-68 border-r border-[var(--color-surface-border)] bg-[#0f1115] p-6 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                lg:relative lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="mb-10 px-2 flex items-center justify-between">
                    <BrandingLogo />
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-muted hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="space-y-2 flex-1">
                    {filteredLinks.map(link => {
                        const isActive = pathname?.startsWith(link.href);
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-muted hover:bg-slate-800/50 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted group-hover:text-primary transition-colors'}`} />
                                <span className="font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800/50 space-y-4">
                    {user && (
                        <div className="glass-panel p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase ring-2 ring-primary/20">
                                {user.full_name?.substring(0, 2) || user.email?.substring(0, 2)}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-white truncate">{user.full_name}</span>
                                <span className="text-[10px] text-muted truncate capitalize">{user.role?.replace('_', ' ')}</span>
                                <div className="text-[8px] text-red-500 font-mono border border-red-500/20 bg-red-500/10 px-1 rounded mt-1">
                                    DEBUG ROLE: {user.role || "NULL"}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            location.href = `/${slug}/login`;
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

function UserInfo() {
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchMe = async () => {
            try {
                const { api } = await import('@/lib/api');
                const res = await api.get('/users/me');
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user info", err);
            }
        };
        fetchMe();
    }, []);

    if (!user) return <div className="animate-pulse h-12 bg-slate-800/50 rounded-xl"></div>;

    return (
        <div className="glass-panel p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase ring-2 ring-primary/20">
                {user.full_name?.substring(0, 2) || user.email?.substring(0, 2)}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate">{user.full_name}</span>
                <span className="text-[10px] text-muted truncate">{user.email}</span>
            </div>
        </div>
    );
}
