import { useCallback, useEffect, useState } from 'react';
import { Trash2, Copy, Info } from 'lucide-react';

interface NodeContextMenuProps {
    nodeId: string;
    x: number;
    y: number;
    onClose: () => void;
    onDelete: () => void;
    onDuplicate?: () => void;
    onViewDetails?: () => void;
}

export function NodeContextMenu({
    nodeId,
    x,
    y,
    onClose,
    onDelete,
    onDuplicate,
    onViewDetails,
}: NodeContextMenuProps) {
    // Close on outside click
    useEffect(() => {
        const handleClick = () => onClose();
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [onClose]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleAction = useCallback(
        (action: () => void) => {
            action();
            onClose();
        },
        [onClose]
    );

    return (
        <div
            className="fixed z-50 bg-white border rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{
                left: `${x}px`,
                top: `${y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {onViewDetails && (
                <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => handleAction(onViewDetails)}
                >
                    <Info className="w-4 h-4" />
                    View Details
                </button>
            )}
            {onDuplicate && (
                <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => handleAction(onDuplicate)}
                >
                    <Copy className="w-4 h-4" />
                    Duplicate
                </button>
            )}
            <div className="border-t my-1" />
            <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                onClick={() => handleAction(onDelete)}
            >
                <Trash2 className="w-4 h-4" />
                Delete Node
            </button>
        </div>
    );
}
