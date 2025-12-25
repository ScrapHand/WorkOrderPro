"use client";
import React from 'react';
import Link from 'next/link';

interface Block {
    id: string;
    type: 'hero' | 'stats' | 'grid' | 'cta';
    props: any;
}

interface PageRendererProps {
    layout: Block[];
}

// Sub-components for blocks
const HeroBlock = ({ title, subtitle, ctaText, ctaLink }: any) => (
    <div className="bg-surface border rounded-lg p-8 mb-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-[var(--color-primary)]">{title}</h1>
        <p className="text-xl text-[var(--color-text)] mb-6">{subtitle}</p>
        {ctaText && (
            <Link
                href={ctaLink || '#'}
                className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
                {ctaText}
            </Link>
        )}
    </div>
);

const StatsBlock = ({ stats }: { stats: { label: string, value: string }[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat: any, i: number) => (
            <div key={i} className="bg-surface p-6 rounded-lg border shadow-sm text-center">
                <div className="text-3xl font-bold text-[var(--color-primary)]">{stat.value}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">{stat.label}</div>
            </div>
        ))}
    </div>
);

const GridBlock = ({ items }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {items.map((item: any, i: number) => (
            <div key={i} className="bg-surface p-6 rounded-lg border hover:shadow-md transition">
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
        ))}
    </div>
);

export default function PageRenderer({ layout }: PageRendererProps) {
    if (!layout || layout.length === 0) {
        return <div className="p-8 text-center text-gray-500">No content configured for this page.</div>;
    }

    return (
        <div>
            {layout.map((block) => {
                switch (block.type) {
                    case 'hero': return <HeroBlock key={block.id} {...block.props} />;
                    case 'stats': return <StatsBlock key={block.id} {...block.props} />;
                    case 'grid': return <GridBlock key={block.id} {...block.props} />;
                    default: return <div key={block.id} className="text-red-500">Unknown block type: {block.type}</div>;
                }
            })}
        </div>
    );
}
