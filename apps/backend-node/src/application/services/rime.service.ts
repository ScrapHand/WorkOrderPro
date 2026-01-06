import { IAssetRepository } from '../../domain/repositories/asset.repository.interface';
import { Asset } from '../../domain/entities/asset.entity';

export enum WorkOrderPriority {
    CRITICAL = 10,
    HIGH = 7,
    MEDIUM = 4,
    LOW = 1
}

export class RimeService {
    constructor(private assetRepo: IAssetRepository) { }

    /**
     * Calculates the RIME Score (Ranking Index for Maintenance Expenditures).
     * Formula: Asset Criticality * Work Order Priority
     */
    async calculateScore(assetId: string, tenantId: string, priority: string): Promise<number> {
        // 1. Get Priority Value
        const priorityScore = this.getPriorityScore(priority);

        // 2. Get Asset and its recursive RIME factors
        const ancestors = await this.assetRepo.findAncestors(assetId, tenantId);

        let risk = 0, impact = 0, maintenance = 0, effort = 0;
        let foundFactors = false;

        for (const asset of ancestors) {
            if (asset.rimeRisk !== null && asset.rimeRisk !== undefined) {
                risk = asset.rimeRisk;
                impact = asset.rimeImpact || 0;
                maintenance = asset.rimeMaintenance || 0;
                effort = asset.rimeEffort || 0;
                foundFactors = true;
                break;
            }
        }

        if (foundFactors) {
            // Formula: (Risk + Impact + Maintenance + Effort) * Priority
            // This is a common variation of RIME when factors are granular.
            return (risk + impact + maintenance + effort) * priorityScore;
        }

        // Fallback: Legacy Criticality * Priority
        let criticality = 5;
        for (const asset of ancestors) {
            if (asset.criticality) {
                criticality = this.mapCriticalityToNumber(asset.criticality);
                break;
            }
        }

        return criticality * priorityScore;
    }

    private getPriorityScore(priority: string): number {
        switch (priority.toUpperCase()) {
            case 'CRITICAL': return WorkOrderPriority.CRITICAL;
            case 'HIGH': return WorkOrderPriority.HIGH;
            case 'MEDIUM': return WorkOrderPriority.MEDIUM;
            case 'LOW': return WorkOrderPriority.LOW;
            default: return WorkOrderPriority.LOW; // Safety fallback
        }
    }

    private async getRecursiveCriticality(assetId: string, tenantId: string): Promise<number> {
        // Fetch chain: Leaf -> Parent -> ... -> Root
        // The implementation of findAncestors returns [Leaf, Parent, Grandparent...] (Depth sorted 0..N)
        const ancestors = await this.assetRepo.findAncestors(assetId, tenantId);

        for (const asset of ancestors) {
            if (asset.criticality) {
                return this.mapCriticalityToNumber(asset.criticality);
            }
        }

        // Default if no parent has value
        return 5;
    }

    private mapCriticalityToNumber(val: string): number {
        // Mapping Phase 2 String Enum to Phase 3 Number Req
        // A = High (10), B = Med (5), C = Low (1)
        // Or if user stored "1"..."10" string, parse it.
        if (val === 'A') return 10;
        if (val === 'B') return 5;
        if (val === 'C') return 1;

        // Try parsing number if schema drifted
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 5 : parsed;
    }
}
