"use client";

import { ReactFlowProvider } from '@xyflow/react';

export default function FactoryLayoutEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
