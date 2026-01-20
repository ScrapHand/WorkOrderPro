import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Assuming this exists based on common patterns

interface GraphState {
    nodes: any[];
    edges: any[];
}

export const useGraphMutation = (layoutId: string) => {
    const queryClient = useQueryClient();
    const queryKey = ['factory-layout', layoutId];

    return useMutation({
        mutationFn: async (updatedGraph: GraphState) => {
            const { data } = await api.put(`/factory-layouts/${layoutId}/graph`, updatedGraph);
            return data;
        },
        // [OPTIMISTIC UI] Instant UI feedback
        onMutate: async (newGraph) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot the previous value
            const previousGraph = queryClient.getQueryData<GraphState>(queryKey);

            // Optimistically update to the new value
            queryClient.setQueryData(queryKey, newGraph);

            // Return a context object with the snapshotted value
            return { previousGraph };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, newGraph, context) => {
            if (context?.previousGraph) {
                queryClient.setQueryData(queryKey, context.previousGraph);
            }
            console.error('[Graph Mutation Error]:', err);
        },
        // Always refetch after error or success:
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
};
