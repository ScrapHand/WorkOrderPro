"use client";
import React from 'react';

interface BlockEditorProps {
    blocks: any[];
    onChange: (blocks: any[]) => void;
}

export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks];
        if (direction === 'up' && index > 0) {
            [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
        } else if (direction === 'down' && index < newBlocks.length - 1) {
            [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
        }
        onChange(newBlocks);
    };

    const deleteBlock = (index: number) => {
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1);
        onChange(newBlocks);
    };

    // Simplistic prop editing for demo
    const updateProp = (index: number, key: string, value: string) => {
        const newBlocks = [...blocks];
        newBlocks[index].props = { ...newBlocks[index].props, [key]: value };
        onChange(newBlocks);
    };

    return (
        <div className="space-y-4">
            {blocks.map((block, index) => (
                <div key={block.id} className="border p-4 rounded bg-surface relative group">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold uppercase text-xs text-gray-500">{block.type} Block</span>
                        <div className="flex gap-2">
                            <button onClick={() => moveBlock(index, 'up')} className="text-gray-400 hover:text-white">↑</button>
                            <button onClick={() => moveBlock(index, 'down')} className="text-gray-400 hover:text-white">↓</button>
                            <button onClick={() => deleteBlock(index)} className="text-red-500 hover:text-red-400">×</button>
                        </div>
                    </div>

                    {/* Dynamic Inputs based on type */}
                    <div className="space-y-2">
                        {block.type === 'hero' && (
                            <>
                                <input
                                    className="w-full bg-black/20 border rounded p-2 text-sm"
                                    placeholder="Title"
                                    value={block.props.title || ''}
                                    onChange={(e) => updateProp(index, 'title', e.target.value)}
                                />
                                <input
                                    className="w-full bg-black/20 border rounded p-2 text-sm"
                                    placeholder="Subtitle"
                                    value={block.props.subtitle || ''}
                                    onChange={(e) => updateProp(index, 'subtitle', e.target.value)}
                                />
                            </>
                        )}
                        {block.type === 'stats' && (
                            <div className="text-sm text-gray-400 italic">Stats config via JSON only for MVP</div>
                        )}
                    </div>
                </div>
            ))}
            <div className="text-center p-4 border-2 border-dashed rounded text-gray-500 cursor-not-allowed opacity-50">
                + Add Block (Coming Soon)
            </div>
        </div>
    );
}
