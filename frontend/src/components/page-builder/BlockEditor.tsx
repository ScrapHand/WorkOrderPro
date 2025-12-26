import {
    MoveUp,
    MoveDown,
    Trash2,
    Plus,
    Type,
    BarChart3,
    Trophy,
    MousePointer2,
    Edit3
} from 'lucide-react';

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

    const updateProp = (index: number, key: string, value: string) => {
        const newBlocks = [...blocks];
        newBlocks[index].props = { ...newBlocks[index].props, [key]: value };
        onChange(newBlocks);
    };

    const addBlock = (type: string) => {
        const id = `${type}-${Math.floor(Math.random() * 10000)}`;
        let props = {};

        switch (type) {
            case 'hero':
                props = { title: "New Headline", subtitle: "Industrial strength subtext", ctaText: "Explore", ctaLink: "#" };
                break;
            case 'stats':
                props = { title: "Operational Pulse", stats: [{ label: "Efficiency", value: "98%" }, { label: "Uptime", value: "24/7" }] };
                break;
            case 'text':
                props = { content: "Add your operations directive here..." };
                break;
            case 'actions':
                props = { title: "Quick Directives", links: [{ label: "New Order", href: "work-orders/new" }] };
                break;
        }

        const newBlock = { id, type, props };
        onChange([...blocks, newBlock]);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {blocks.map((block, index) => (
                    <div key={block.id} className="glass-panel p-6 border-white/5 relative group animate-in slide-in-from-left-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-primary" />
                                <span className="font-black uppercase text-[10px] tracking-[0.2em] text-white/50">{block.type} Module</span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => moveBlock(index, 'up')} className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-white transition-all"><MoveUp className="w-4 h-4" /></button>
                                <button onClick={() => moveBlock(index, 'down')} className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-white transition-all"><MoveDown className="w-4 h-4" /></button>
                                <button onClick={() => deleteBlock(index)} className="p-2 hover:bg-white/5 rounded-lg text-danger/50 hover:text-danger transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {block.type === 'hero' && (
                                <>
                                    <EditField label="Title" value={block.props.title} onChange={(v: string) => updateProp(index, 'title', v)} />
                                    <EditField label="Subtitle" value={block.props.subtitle} onChange={(v: string) => updateProp(index, 'subtitle', v)} />
                                    <EditField label="Button Text" value={block.props.ctaText} onChange={(v: string) => updateProp(index, 'ctaText', v)} />
                                    <EditField label="Button Link" value={block.props.ctaLink} onChange={(v: string) => updateProp(index, 'ctaLink', v)} />
                                </>
                            )}
                            {block.type === 'text' && (
                                <div className="col-span-full">
                                    <label className="text-[9px] font-black text-muted uppercase tracking-widest mb-2 block">Content Body</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary outline-none transition-all h-32"
                                        value={block.props.content || ''}
                                        onChange={(e) => updateProp(index, 'content', e.target.value)}
                                    />
                                </div>
                            )}
                            {block.type === 'stats' && (
                                <div className="col-span-full space-y-4">
                                    <EditField label="Monitor Title" value={block.props.title} onChange={(v: string) => updateProp(index, 'title', v)} />
                                    <p className="text-[9px] text-muted italic font-bold">Statistic values are currently linked to live telemetry.</p>
                                </div>
                            )}
                            {block.type === 'actions' && (
                                <EditField label="Section Header" value={block.props.title} onChange={(v: string) => updateProp(index, 'title', v)} />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 p-6 bg-black/20 border-2 border-dashed border-white/5 rounded-2xl">
                <AddButton icon={Trophy} label="Hero" onClick={() => addBlock('hero')} />
                <AddButton icon={BarChart3} label="Stats" onClick={() => addBlock('stats')} />
                <AddButton icon={Type} label="Text" onClick={() => addBlock('text')} />
                <AddButton icon={MousePointer2} label="Actions" onClick={() => addBlock('actions')} />
            </div>
        </div>
    );
}

const EditField = ({ label, value, onChange }: any) => (
    <div className="space-y-1.5 text-left">
        <label className="text-[9px] font-black text-muted uppercase tracking-widest px-1">{label}</label>
        <input
            className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-primary/50 focus:bg-black/40 outline-none transition-all"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const AddButton = ({ icon: Icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 rounded-xl text-[10px] font-black uppercase text-muted hover:text-white transition-all group"
    >
        <Plus className="w-3.5 h-3.5 text-primary group-hover:scale-125 transition-transform" />
        <Icon className="w-3.5 h-3.5" />
        {label}
    </button>
);
