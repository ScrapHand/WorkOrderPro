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
    X
} from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { tenant, isLoading } = useTenant();
    const pathname = usePathname();
    const slug = tenant?.slug || 'demo';

    const links = [
        { label: 'Dashboard', href: `/${slug}/dashboard`, icon: LayoutDashboard },
        { label: 'Work Orders', href: `/${slug}/work-orders`, icon: ClipboardList },
        { label: 'PM Schedule', href: `/${slug}/pm-schedule`, icon: CalendarClock },
        { label: 'Assets', href: `/${slug}/assets`, icon: Box },
        { label: 'Inventory', href: `/${slug}/inventory`, icon: Package },
        { label: 'Admin', href: `/${slug}/admin`, icon: Settings },
    ];

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
                    <div className="flex items-center gap-3">
                        {logoUrl ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
                                <img src={resolveBackendUrl(logoUrl) || ""} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                <ShieldCheck className="text-primary w-6 h-6" />
                            </div>
                        )}
                        {isLoading ? (
                            <div className="animate-pulse h-6 w-32 bg-slate-800 rounded"></div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="font-bold text-lg tracking-tight text-white leading-none">
                                    {tenant?.name || "WorkOrderPro"}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mt-1">
                                    Industrial CMMS
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-muted hover:text-white transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5" /> {/* Using LayoutDashboard as a placeholder or could use X from lucide-react if imported */}
                    </button>
                </div>

                <nav className="space-y-2 flex-1">
                    {links.map(link => {
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

                <div className="mt-auto pt-6 border-t border-slate-800/50">
                    <div className="glass-panel p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            AD
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Admin User</span>
                            <span className="text-[10px] text-muted">admin@demo.com</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

