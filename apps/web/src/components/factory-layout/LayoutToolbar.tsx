import { Lock, Unlock, Save, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LayoutToolbarProps {
    isLocked: boolean;
    isSaving: boolean;
    onToggleLock: () => void;
    onSave: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    canEdit: boolean;
}

export function LayoutToolbar({
    isLocked,
    isSaving,
    onToggleLock,
    onSave,
    onZoomIn,
    onZoomOut,
    onFitView,
    canEdit,
}: LayoutToolbarProps) {
    return (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border p-2 flex gap-2 items-center">
            {/* Lock Status Badge */}
            {isLocked && (
                <Badge variant="secondary" className="gap-1">
                    <Lock className="w-3 h-3" />
                    Locked
                </Badge>
            )}

            {/* Zoom Controls */}
            <div className="flex gap-1 border-r pr-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomIn}
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onZoomOut}
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFitView}
                    title="Fit View"
                >
                    <Maximize className="w-4 h-4" />
                </Button>
            </div>

            {/* Edit Controls (Only for TENANT_ADMIN) */}
            {canEdit && (
                <>
                    <Button
                        variant={isLocked ? 'default' : 'outline'}
                        size="sm"
                        onClick={onToggleLock}
                        className="gap-2"
                    >
                        {isLocked ? (
                            <>
                                <Unlock className="w-4 h-4" />
                                Unlock
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Lock
                            </>
                        )}
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={onSave}
                        disabled={isSaving || isLocked}
                        className="gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </>
            )}
        </div>
    );
}
