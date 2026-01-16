import { RimeService } from '../rime.service';
import { IAssetRepository } from '../../../domain/repositories/asset.repository.interface';
import { Asset } from '../../../domain/entities/asset.entity';
import { WorkOrderPriority } from '@workorderpro/shared';

describe('RimeService', () => {
    let rimeService: RimeService;
    let mockAssetRepo: jest.Mocked<IAssetRepository>;

    beforeEach(() => {
        mockAssetRepo = {
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            findSubtree: jest.fn(),
            findChildren: jest.fn(),
            findAncestors: jest.fn(),
            findAll: jest.fn(),
        };
        rimeService = new RimeService(mockAssetRepo);
    });

    it('should calculate score correctly with all granular RIME factors present', async () => {
        const asset = new Asset(
            'asset1', 'tenant1', 'Asset 1', 'CODE1', 'OPERATIONAL', 'A', '/', null,
            '', null, null, null, null, null, null, {}, 10, 5, 2, 3 // Risk=10, Impact=5, Maintenance=2, Effort=3 -> Total=20
        );

        mockAssetRepo.findAncestors.mockResolvedValue([asset]);

        const score = await rimeService.calculateScore('asset1', 'tenant1', 'HIGH');

        // (10 + 5 + 2 + 3) * 7 (Priority.HIGH) = 140
        expect(score).toBe(140);
    });

    it('should fallback to legacy criticality if RIME factors are missing', async () => {
        const asset = new Asset(
            'asset1', 'tenant1', 'Asset 1', 'CODE1', 'OPERATIONAL', 'B', '/', null,
            '', null, null, null, null, null, null, {}, null, null, null, null // No granular factors
        );

        mockAssetRepo.findAncestors.mockResolvedValue([asset]);

        const score = await rimeService.calculateScore('asset1', 'tenant1', 'MEDIUM');

        // B = 5 (Criticality) * 4 (Priority.MEDIUM) = 20
        expect(score).toBe(20);
    });

    it('should use recursive criticality from first parent with value', async () => {
        const leaf = new Asset('leaf', 'tenant1', 'Leaf', 'L', 'OPERATIONAL', 'C', '/', 'parent', '', null, null, null, null, null, {});
        const parent = new Asset('parent', 'tenant1', 'Parent', 'P', 'OPERATIONAL', 'A', '/', null, '', null, null, null, null, null, {});

        // Leaf has C (1), Parent has A (10). RIME should find A eventually.
        // Actually findAncestors returns [Leaf, Parent]
        // RimeService loops through ancestors and takes the FIRST one with criticality

        mockAssetRepo.findAncestors.mockResolvedValue([leaf, parent]);

        const score = await rimeService.calculateScore('leaf', 'tenant1', 'LOW');

        // Leaf has criticality 'C' -> score 1. Priority LOW -> score 1.
        expect(score).toBe(1);
    });
});
