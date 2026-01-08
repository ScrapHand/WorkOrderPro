import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './use-debounce';

interface AutoSaveOptions {
    delay?: number; // Delay in milliseconds (default: 3000)
    onSave: () => Promise<void>;
    enabled?: boolean;
}

export function useAutoSave(
    data: any,
    { delay = 3000, onSave, enabled = true }: AutoSaveOptions
) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<Error | null>(null);
    const isInitialMount = useRef(true);

    const debouncedData = useDebounce(data, delay);

    useEffect(() => {
        // Skip the first render (when component mounts)
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Skip if auto-save is disabled
        if (!enabled) return;

        // Skip if no data
        if (!debouncedData) return;

        // Auto-save
        const save = async () => {
            try {
                setIsSaving(true);
                setSaveError(null);
                await onSave();
                setLastSaved(new Date());
            } catch (error) {
                setSaveError(error as Error);
                console.error('Auto-save failed:', error);
            } finally {
                setIsSaving(false);
            }
        };

        save();
    }, [debouncedData, onSave, enabled]);

    return {
        isSaving,
        lastSaved,
        saveError,
    };
}
