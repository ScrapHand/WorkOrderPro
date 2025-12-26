"use client";
import React from 'react';
import { Menu } from 'lucide-react';
import { BrandingLogo } from './BrandingLogo';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="lg:hidden h-16 border-b border-[var(--color-surface-border)] bg-[#0f1115] px-4 flex items-center justify-between sticky top-0 z-30">
            <button
                onClick={onMenuClick}
                className="p-2 text-muted hover:text-white transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>

            <BrandingLogo size="sm" />

            {/* Spacer to center the logo roughly or just provide balance */}
            <div className="w-10"></div>
        </header>
    );
}
